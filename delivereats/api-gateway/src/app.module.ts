import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { join } from 'path';
import { RestaurantController } from './restaurant.controller';
import { OrderController } from './order.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE', // Nombre para inyectar después
        transport: Transport.GRPC,
        options: {
          package: 'auth',
          protoPath: join(process.cwd(), 'src/proto/auth.proto'),
          url: 'localhost:50051', // Apunta al Auth-Service
        },
      },
      {
        name: 'RESTAURANT_SERVICE', // Nombre para inyectar
        transport: Transport.GRPC,
        options: {
          package: 'restaurant', // Debe coincidir con el package del .proto
          protoPath: join(process.cwd(), 'src/proto/restaurant.proto'),
          url: 'localhost:50052', // <--- OJO: Puerto 50052 (El de Restaurant-Service)
        },
      },
      {
    name: 'ORDER_SERVICE',
    transport: Transport.GRPC,
    options: {
      package: 'order',
      protoPath: join(process.cwd(), 'src/proto/order.proto'),
      url: 'localhost:50053', // <--- Puerto del Order-Service
    },
  },
    ]),
  ],
  controllers: [AppController, RestaurantController, OrderController],
  providers: [],
})
export class AppModule {}
