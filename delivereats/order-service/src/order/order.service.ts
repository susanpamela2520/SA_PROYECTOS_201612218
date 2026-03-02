import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @Inject('RESTAURANT_QUEUE') private restaurantQueue: ClientProxy,
    @Inject('DELIVERY_QUEUE') private deliveryQueue: ClientProxy,
    @Inject('PAYMENT_QUEUE') private paymentQueue: ClientProxy,
  ) {}

  // 1. Crear Orden (Calcula total y guarda items)
  async createOrder(data: any): Promise<Order> {
    const { userId, restaurantId, items, restaurantName } = data;

    // Calcular el total del pedido sumando (precio * cantidad) de cada item
    let totalAmount = 0;

    // Preparamos los items para guardarlos
    const orderItems = items.map((item) => {
      const subtotal = item.price * item.quantity;
      totalAmount += subtotal;

      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
      };
    });

    // Creamos la instancia de la Orden
    const newOrder = this.orderRepo.create({
      userId,
      restaurantId,
      restaurantName,
      total: totalAmount,
      status: 'Pendiente', // Estado inicial por defecto
      items: orderItems, // TypeORM guardará esto automáticamente gracias a cascade: true
    });

    // Guardar en BD (Transacción única)
    const savedOrder = await this.orderRepo.save(newOrder);

    // --- NUEVO: EMITIR EL EVENTO A LA COLA ---
    // Le pasamos al restaurante toda la información que necesita para empezar a cocinar
    this.restaurantQueue.emit('new_order_placed', {
      orderId: savedOrder.id,
      restaurantId: savedOrder.restaurantId,
      userId: savedOrder.userId,
      items: savedOrder.items, // Mandamos la lista exacta de qué tienen que cocinar
      total: savedOrder.total,
      timestamp: savedOrder.createdAt, // Fecha en la que entró el pedido
    });

    console.log(
      `[Order Service] 📢 Orden #${savedOrder.id} enviada a la cola del restaurante ${restaurantId}`,
    );
    // ------------------------------------------

    return savedOrder;
  }

  // 2. Obtener una orden por ID
  async getOrder(id: number): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items'], // Traer también los platos pedidos
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    return order;
  }

  // 3. Obtener historial de órdenes de un usuario
  async getOrdersByUser(userId: number): Promise<{ orders: Order[] }> {
    const orders = await this.orderRepo.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' }, // Las más recientes primero
    });
    return { orders };
  }

  // 4. Actualizar estado (PENDING -> PREPARING -> READY -> DELIVERED)
  async updateOrderStatus(data: {
    id: number;
    status: string;
    proofOfDelivery?: string;
  }): Promise<Order> {
    const order = await this.getOrder(data.id);
    order.status = data.status;
    if (data.proofOfDelivery) {
      order.proofOfDelivery = data.proofOfDelivery;
    }
    return await this.orderRepo.save(order);
  }

  async getOrdersByRestaurant(restaurantId: number) {
    try {
      const orders = await this.orderRepo.find({
        where: { restaurantId },
        relations: ['items'], // Esto trae el detalle de los platos
        order: { createdAt: 'DESC' }, // Las más recientes primero
      });

      return { orders };
    } catch (error) {
      console.error('Error en DB:', error);
      return { orders: [] };
    }
  }

  async cancelOrder(id: number) {
    try {
      const order = await this.orderRepo.findOne({ where: { id } });
      if (!order) return null;

      if (order.status === 'Entregado') {
        throw new Error(
          'No se puede cancelar una orden que ya está en camino o entregada',
        );
      }

      order.status = 'Cancelada';
      const savedOrder = await this.orderRepo.save(order);

      // --- NUEVO: AVISAR A PAGOS PARA EL REEMBOLSO ---
      // Si la orden tenía un total mayor a 0, avisamos a RabbitMQ
      if (savedOrder.total > 0) {
        this.paymentQueue.emit('order_cancelled', {
          orderId: savedOrder.id,
          userId: savedOrder.userId,
          amount: savedOrder.total,
        });

        this.deliveryQueue.emit('order_cancelled', { orderId: savedOrder.id });
        console.log(
          `💸 [Order Service] Orden #${id} cancelada. Solicitando reembolso de Q${savedOrder.total}`,
        );
      }

      return savedOrder;
    } catch (error) {
      console.error('Error al cancelar:', error);
      throw error;
    }
  }

  async rateOrder(data: any): Promise<Order> {
    // 1. Buscamos la orden CON sus items (relations: ['items'])
    const order = await this.orderRepo.findOne({
      where: { id: data.id },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Orden #${data.id} no encontrada`);
    }

    // 2. Validaciones de negocio
    if (order.status !== 'Entregado' && order.status !== 'ENTREGADO') {
      throw new Error(
        'Solo puedes calificar pedidos que ya fueron entregados.',
      );
    }
    if (order.rating || order.deliveryRating) {
      throw new Error('Este pedido ya fue calificado anteriormente.');
    }

    // 3. Asignamos las calificaciones al Restaurante y al Repartidor
    order.rating = data.rating;
    order.comment = data.comment;
    order.deliveryRating = data.deliveryRating;
    order.deliveryComment = data.deliveryComment;

    // 4. Asignamos los likes/dislikes a los platillos
    if (data.items && data.items.length > 0) {
      order.items = order.items.map((orderItem) => {
        // Buscamos si el usuario envió una calificación para este item
        const itemRating = data.items.find(
          (i: any) => i.menuItemId === orderItem.menuItemId,
        );
        if (itemRating && itemRating.isRecommended !== undefined) {
          orderItem.isRecommended = itemRating.isRecommended;
        }
        return orderItem;
      });
    }

    // 5. Guardamos TODO en la base de datos (TypeORM actualiza Order y OrderItems mágicamente gracias a cascade:true)
    const savedOrder = await this.orderRepo.save(order);

    // =======================================================
    // 6. EVENTOS A RABBITMQ (Desacoplamiento)
    // =======================================================

    // A) Avisar calificación del Restaurante
    if (savedOrder.rating) {
      this.restaurantQueue.emit('order_rated', {
        restaurantId: savedOrder.restaurantId,
        orderId: savedOrder.id,
        rating: savedOrder.rating,
        comment: savedOrder.comment,
      });
    }

    // B) Avisar calificación de los Platillos
    if (data.items && data.items.length > 0) {
      this.restaurantQueue.emit('items_rated', {
        restaurantId: savedOrder.restaurantId,
        orderId: savedOrder.id,
        items: data.items,
      });
    }

    // C) Avisar calificación del Repartidor
    if (savedOrder.deliveryRating) {
      this.deliveryQueue.emit('delivery_rated', {
        orderId: savedOrder.id, // Con el orderId, el Delivery Service sabrá qué repartidor fue
        rating: savedOrder.deliveryRating,
        comment: savedOrder.deliveryComment,
      });
    }

    console.log(
      `[Order Service] Orden #${savedOrder.id} calificada completamente. 3 Eventos enviados a RabbitMQ.`,
    );

    return savedOrder;
  }
}
