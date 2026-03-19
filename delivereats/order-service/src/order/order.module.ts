import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

const rabbitUrl =
  process.env.RABBITMQ_URL || 'amqp://admin:123456@rabbitmq-service:5672';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    ClientsModule.register([
      {
        name: 'RESTAURANT_QUEUE', // Nombre para inyectarlo
        transport: Transport.RMQ,
        options: {
          urls: [rabbitUrl], // Ojo con la URL si es Docker
          queue: 'orders_queue', // <--- Nombre
          queueOptions: {
            durable: false,
          },
        },
      },
      {
        name: 'DELIVERY_QUEUE',
        transport: Transport.RMQ,
        options: {
          urls: [rabbitUrl],
          queue: 'delivery_queue', // El Delivery Service escuchará aquí
          queueOptions: { durable: false },
        },
      },
      {
        name: 'PAYMENT_QUEUE',
        transport: Transport.RMQ,
        options: {
          urls: [rabbitUrl],
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
