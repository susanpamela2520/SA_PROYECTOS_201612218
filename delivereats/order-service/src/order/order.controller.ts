import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { OrderService } from './order.service';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @GrpcMethod('OrderService', 'CreateOrder')
  createOrder(data: any) {
    return this.orderService.createOrder(data);
  }

  @GrpcMethod('OrderService', 'GetOrder')
  getOrder(data: { id: number }) {
    return this.orderService.getOrder(data.id);
  }

  @GrpcMethod('OrderService', 'GetOrdersByUser')
  getOrdersByUser(data: { userId: number }) {
    return this.orderService.getOrdersByUser(data.userId);
  }

  @GrpcMethod('OrderService', 'UpdateOrderStatus')
  updateStatus(data: { id: number; status: string; proofOfDelivery?: string }) {
    return this.orderService.updateOrderStatus(data);
  }

  @GrpcMethod('OrderService', 'GetOrdersByRestaurant')
  async getOrdersByRestaurant(data: { restaurantId: number }) {
    console.log(
      'Microservicio: Buscando órdenes para el local',
      data.restaurantId,
    );
    return this.orderService.getOrdersByRestaurant(data.restaurantId);
  }

  @GrpcMethod('OrderService', 'CancelOrder') // <--- Debe coincidir EXACTO con el .proto
  async cancelOrder(data: { id: number }) {
    return this.orderService.cancelOrder(data.id);
  }

  @GrpcMethod('OrderService', 'RateOrder')
  rateOrder(data: any) {
    // "data" ahora trae id, rating, deliveryRating, e items[]
    return this.orderService.rateOrder(data);
  }
}
