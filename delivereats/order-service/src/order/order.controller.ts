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
  updateStatus(data: { id: number; status: string }) {
    return this.orderService.updateOrderStatus(data);
  }
}