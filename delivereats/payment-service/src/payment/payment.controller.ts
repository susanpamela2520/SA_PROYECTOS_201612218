import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PaymentService } from './payment.service';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @GrpcMethod('PaymentService', 'RechargeWallet')
  recharge(data: any) {
    return this.paymentService.recharge(data);
  }

  @GrpcMethod('PaymentService', 'ProcessOrderPayment')
  processPayment(data: any) {
    return this.paymentService.processPayment(data);
  }

  @GrpcMethod('PaymentService', 'GetWallet')
  async getWallet(data: { userId: number }) {
    const wallet = await this.paymentService.getOrCreateWallet(data.userId);
    return { userId: wallet.userId, balance: wallet.balance };
  }

  // ESCUCHAR REEMBOLSOS (RabbitMQ)
  @EventPattern('order_cancelled')
  async handleOrderCancelled(@Payload() data: any) {
    console.log(
      `\n📥 [RabbitMQ] Petición de reembolso recibida para orden #${data.orderId}`,
    );
    await this.paymentService.refund(data.orderId, data.userId, data.amount);
  }
}
