import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { DeliveryService } from './delivery.service';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @GrpcMethod('DeliveryService', 'AcceptOrder')
  acceptOrder(data: { orderId: number; driverId: number }) {
    console.log(data);
    return this.deliveryService.acceptOrder(data);
  }

  @GrpcMethod('DeliveryService', 'UpdateDeliveryStatus')
  updateStatus(data: { deliveryId: number; status: string }) {
    console.log(data);
    return this.deliveryService.updateStatus(data);
  }

  @GrpcMethod('DeliveryService', 'GetDeliveriesByDriver')
  async getByDriver(data: { driverId: number }) {
    return this.deliveryService.getDeliveriesByDriver(data.driverId);
  }

  @GrpcMethod('DeliveryService', 'HealthCheck')
  healthCheck() {
    console.log('¡MICROSERVICIO ALCANZADO! ');
    return {
      message:
        'Hola desde el Microservicio Delivery! La conexión gRPC funciona.',
    };
  }

  @EventPattern('delivery_rated')
  async handleDeliveryRated(@Payload() data: any) {
    console.log(`\n📥 [RabbitMQ] Evento recibido: 'delivery_rated'`);
    await this.deliveryService.updateDeliveryRating(data);
  }

  @EventPattern('order_cancelled')
  async handleOrderCancelled(@Payload() data: { orderId: number }) {
    console.log(
      `\n[RabbitMQ] Cancelación recibida para el viaje de la orden #${data.orderId}`,
    );
    await this.deliveryService.cancelDeliveryByOrderId(data.orderId);
  }
}
