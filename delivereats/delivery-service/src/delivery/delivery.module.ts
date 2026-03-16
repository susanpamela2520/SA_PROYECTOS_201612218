import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { Delivery } from './entities/delivery.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Delivery]),
    // Cliente para hablar con el Order-Service
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
    ]),
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService],
})
export class DeliveryModule {}
