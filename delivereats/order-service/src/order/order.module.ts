import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    ClientsModule.register([
      {
        name: 'RESTAURANT_QUEUE', // Nombre para inyectarlo
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@localhost:5672'], // Ojo con la URL si es Docker
          queue: 'orders_queue', // <--- Nombre importante
          queueOptions: {
            durable: false,
          },
        },
      },
      {
        name: 'DELIVERY_QUEUE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@127.0.0.1:5672'],
          queue: 'delivery_queue', // El Delivery Service escuchará aquí
          queueOptions: { durable: false },
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
  ], // Importante registrar las entidades
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
