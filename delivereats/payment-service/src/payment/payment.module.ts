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
          url: 'localhost:50053', // Nombre del contenedor de órdenes en Docker
        },
      },
      {
        name: 'PAYMENT_QUEUE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@127.0.0.1:5672'],
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
