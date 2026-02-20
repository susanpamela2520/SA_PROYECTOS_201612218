import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  // 1. Crear Orden (Calcula total y guarda items)
  async createOrder(data: any): Promise<Order> {
    const { userId, restaurantId, items } = data;

    // Calcular el total del pedido sumando (precio * cantidad) de cada item
    let totalAmount = 0;
    
    // Preparamos los items para guardarlos
    const orderItems = items.map((item) => {
      const subtotal = item.price * item.quantity;
      totalAmount += subtotal;
      
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price, // Guardamos el precio al momento de la compra
      };
    });

    // Creamos la instancia de la Orden
    const newOrder = this.orderRepo.create({
      userId,
      restaurantId,
      total: totalAmount,
      status: 'PENDING', // Estado inicial por defecto
      items: orderItems, // TypeORM guardará esto automáticamente gracias a cascade: true
    });

    // Guardar en BD (Transacción única)
    return await this.orderRepo.save(newOrder);
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
  async updateOrderStatus(data: { id: number; status: string }): Promise<Order> {
    const order = await this.getOrder(data.id);
    order.status = data.status;
    return await this.orderRepo.save(order);
  }
}