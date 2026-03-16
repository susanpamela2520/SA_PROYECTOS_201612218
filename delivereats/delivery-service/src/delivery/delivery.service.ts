import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrpcMethod, type ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { Delivery } from './entities/delivery.entity';

// Interfaz local para el cliente gRPC de Órdenes
interface OrderServiceClient {
  updateOrderStatus(data: {
    id: number;
    status: string;
    proofOfDelivery?: string;
  }): any;
  getOrder(data: { id: number }): any;
}

@Injectable()
export class DeliveryService implements OnModuleInit {
  private orderService: OrderServiceClient;

  constructor(
    @InjectRepository(Delivery)
    private deliveryRepo: Repository<Delivery>,
    @Inject('ORDER_SERVICE') private client: ClientGrpc, // Inyectamos el cliente
  ) {}

  onModuleInit() {
    this.orderService =
      this.client.getService<OrderServiceClient>('OrderService');
  }

  // 1. ACEPTAR PEDIDO
  async acceptOrder(data: { orderId: number; driverId: number }) {
    console.log('llegando');
    // A. Creamos el registro en nuestra DB local
    const newDelivery = this.deliveryRepo.create({
      orderId: data.orderId,
      driverId: data.driverId,
      status: 'En_camino',
    });
    const saved = await this.deliveryRepo.save(newDelivery);

    // B. Avisamos al Order-Service para que actualice el estado global
    try {
      await lastValueFrom(
        this.orderService.updateOrderStatus({
          id: data.orderId,
          status: 'En_camino', // El estado que pide el PDF
        }),
      );
    } catch (error) {
      console.error('Error actualizando Order-Service:', error);
      // Opcional: Podrías hacer rollback aquí si es crítico
    }

    return saved;
  }

  // 2. ACTUALIZAR ESTADO (Entregado / Cancelado)
  async updateStatus(data: {
    deliveryId: number;
    status: string;
    proofOfDelivery?: string;
  }) {
    const delivery = await this.deliveryRepo.findOneBy({ id: data.deliveryId });
    if (!delivery) throw new Error('Entrega no encontrada');

    delivery.status = data.status;

    // Si nos mandan foto (solo aplica cuando status es ENTREGADO), la guardamos
    if (data.proofOfDelivery) {
      delivery.proofOfDelivery = data.proofOfDelivery;
    }

    const updated = await this.deliveryRepo.save(delivery);

    // Sincronizamos con Order-Service (esto sigue igual)
    try {
      await lastValueFrom(
        this.orderService.updateOrderStatus({
          id: delivery.orderId,
          status: data.status,
          proofOfDelivery: data.proofOfDelivery,
        }),
      );
    } catch (error) {
      console.error('Error sincronizando estado:', error);
    }

    return updated;
  }

  // 3. VER MIS ENTREGAS

  async getDeliveriesByDriver(driverId: number) {
    // A. Buscamos las entregas en BD local
    const deliveries = await this.deliveryRepo.find({
      where: { driverId },
      order: { startTime: 'DESC' }, // Opcional: Ordenar por fecha
    });

    // B. "Hidratamos" cada entrega con datos del Order Service
    const enrichedDeliveries = await Promise.all(
      deliveries.map(async (delivery) => {
        try {
          const order: any = await lastValueFrom(
            this.orderService.getOrder({ id: delivery.orderId }),
          );

          return {
            id: delivery.id,
            orderId: delivery.orderId,
            driverId: delivery.driverId,
            status: delivery.status,
            proofOfDelivery: delivery.proofOfDelivery,
            startTime: delivery.startTime,
            restaurantName: order.restaurantName || 'Restaurante Desconocido',
            total: Number(order.total) || 0,

            // --> AGREGAR ESTOS DOS CAMPOS <--
            rating: delivery.rating,
            comment: delivery.comment,
          };
        } catch (error) {
          // ... tu catch actual
        }
      }),
    );

    // C. Retornamos el objeto { deliveries: [...] } que pide el proto
    return { deliveries: enrichedDeliveries };
  }

  async updateDeliveryRating(data: {
    orderId: number;
    rating: number;
    comment?: string;
  }) {
    // Buscamos cuál fue el viaje asociado a esa orden
    const delivery = await this.deliveryRepo.findOne({
      where: { orderId: data.orderId },
    });

    if (!delivery) {
      console.error(
        `[Error] Entrega de la orden ${data.orderId} no encontrada.`,
      );
      return;
    }

    delivery.rating = data.rating;
    delivery.comment = data.comment || '';
    await this.deliveryRepo.save(delivery);

    console.log(
      `[Delivery Service] Calificación de ${data.rating} guardada para el repartidor ID: ${delivery.driverId}`,
    );
  }

  async cancelDeliveryByOrderId(orderId: number) {
    const delivery = await this.deliveryRepo.findOne({ where: { orderId } });

    if (delivery && delivery.status !== 'Entregado') {
      delivery.status = 'Cancelado';
      await this.deliveryRepo.save(delivery);
      console.log(
        `[Delivery Service] Viaje de la orden #${orderId} marcado como Cancelado.`,
      );
    }
  }
}
