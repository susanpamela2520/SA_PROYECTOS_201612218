import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { RestaurantController } from './restaurant.controller';
import { OrderController } from './order.controller';
import { join } from 'path';
import { existsSync } from 'fs';
import { DeliveryController } from './delivery.controller';
import { PaymentController } from './payment.controller';
import { FxController } from './fx.controller';

const protoPathRoot = existsSync(join(process.cwd(), 'dist/proto'))
  ? join(process.cwd(), 'dist/proto')
  : join(process.cwd(), 'src/proto');

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'auth',
          protoPath: join(protoPathRoot, 'auth.proto'),
          /* url: 'auth-service:50051', */
          url: process.env.AUTH_SERVICE_URL || 'auth-service:50051',
        },
      },
      {
        name: 'RESTAURANT_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'restaurant',
          protoPath: join(protoPathRoot, 'restaurant.proto'),
          url: process.env.RESTAURANT_SERVICE_URL || 'restaurant-service:50052',
        },
      },
      {
        name: 'ORDER_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'order',
          protoPath: join(protoPathRoot, 'order.proto'),
          url: process.env.ORDER_SERVICE_URL || 'order-service:50053',
        },
      },
      {
        name: 'DELIVERY_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'delivery',
          protoPath: join(protoPathRoot, 'delivery.proto'),
          url: process.env.DELIVERY_SERVICE_URL || 'delivery-service:50054', // Puerto del nuevo microservicio (asegúrate que coincida con docker-compose)
        },
      },
      {
        name: 'PAYMENT_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'payment',
          protoPath: join(protoPathRoot, 'payment.proto'), // Ajusta la ruta a tu carpeta proto
          url: process.env.PAYMENT_SERVICE_URL || 'payment-service:50055', // El puerto que pusimos en el payment-service
        },
      },
      {
        name: 'FX_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'fx',
          protoPath: join(protoPathRoot, 'fx.proto'), // Ajusta la ruta a tu carpeta proto
          url: process.env.FX_SERVICE_URL || 'fx-service:50056', // El puerto que pusimos en el payment-service
        },
      },
    ]),
  ],
  controllers: [
    AppController,
    RestaurantController,
    OrderController,
    DeliveryController,
    PaymentController,
    FxController,
  ],
  providers: [],
})
export class AppModule {}
