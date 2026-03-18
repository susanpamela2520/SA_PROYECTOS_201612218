import { Module } from '@nestjs/common';
import { FxService } from './fx.service';
import { FxController } from './fx.controller';
import { HttpModule } from '@nestjs/axios';
/* import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Wallet } from './entities/wallet.entity'; */

@Module({
  imports: [
    HttpModule,
    /* TypeOrmModule.forFeature([Wallet]),

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
    ]), */
  ],
  controllers: [FxController],
  providers: [FxService],
})
export class FxModule {}
