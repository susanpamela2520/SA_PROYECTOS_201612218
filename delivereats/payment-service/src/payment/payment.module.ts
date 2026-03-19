import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Wallet } from './entities/wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet]),

    ClientsModule.register([
      {
        name: 'ORDER_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'order', // Debe coincidir con tu order.proto
          protoPath: join(__dirname, '../proto/order.proto'),
          url: process.env.ORDER_SERVICE_URL || 'order-service:50053', // Nombre del contenedor de órdenes en Docker
        },
      },
      {
        name: 'PAYMENT_QUEUE',
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URL ||
              'amqp://admin:123456@rabbitmq-service:5672',
          ],
          queue: 'payment_queue',
          queueOptions: { durable: false },
        },
      },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
