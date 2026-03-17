import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { GrpcMethod, type ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

// Interfaz para hablar con el Order Service
interface OrderServiceClient {
  updateOrderStatus(data: { id: number; status: string }): any;
}

@Injectable()
export class PaymentService implements OnModuleInit {
  private orderServiceClient: OrderServiceClient;

  constructor(
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    @Inject('ORDER_SERVICE') private client: ClientGrpc, // Cliente gRPC
  ) {}

  onModuleInit() {
    this.orderServiceClient =
      this.client.getService<OrderServiceClient>('OrderService');
  }

  // Obtiene la billetera o le crea una nueva en Q0.00
  async getOrCreateWallet(userId: number) {
    let wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) {
      wallet = this.walletRepo.create({ userId, balance: 0 });
      await this.walletRepo.save(wallet);
    }
    return wallet;
  }

  // 1. RECARGAR BILLETERA (Simulador de Tarjeta)
  async recharge(data: any) {
    // Simulación: Si la tarjeta termina en "0000", el banco la rechaza
    if (data.cardNumber.endsWith('0000')) {
      return {
        success: false,
        message: 'Tarjeta rechazada por el banco.',
        newBalance: 0,
      };
    }

    const wallet = await this.getOrCreateWallet(data.userId);
    wallet.balance = Number(wallet.balance) + Number(data.amount);
    await this.walletRepo.save(wallet);

    return {
      success: true,
      message: 'Recarga exitosa',
      newBalance: wallet.balance,
    };
  }

  // 2. PAGAR ORDEN
  async processPayment(data: any) {
    const wallet = await this.getOrCreateWallet(data.userId);

    if (Number(wallet.balance) < Number(data.amount)) {
      return {
        success: false,
        message: 'Saldo insuficiente en la billetera virtual.',
        newBalance: wallet.balance,
      };
    }

    // Descontamos el dinero
    wallet.balance = Number(wallet.balance) - Number(data.amount);
    await this.walletRepo.save(wallet);

    // Vía gRPC, le decimos al Order Service que actualice a "Pagado"
    try {
      await lastValueFrom(
        this.orderServiceClient.updateOrderStatus({
          id: data.orderId,
          status: 'Pagado',
        }),
      );
      console.log(
        `✅ Pago exitoso. Orden #${data.orderId} marcada como PAGADO.`,
      );
    } catch (e) {
      console.error(
        'Error conectando con Order Service para confirmar pago',
        e,
      );
    }

    return {
      success: true,
      message: 'Pago realizado correctamente',
      newBalance: wallet.balance,
    };
  }

  // 3. REEMBOLSO (Escuchando a RabbitMQ)
  async refund(orderId: number, userId: number, amount: number) {
    const wallet = await this.getOrCreateWallet(userId);
    wallet.balance = Number(wallet.balance) + Number(amount);
    await this.walletRepo.save(wallet);
    console.log(
      `💸 [Reembolso] Q${amount} devueltos al usuario ${userId} por cancelación de la orden #${orderId}`,
    );
  }
}
