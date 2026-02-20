import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderModule } from './order/order.module';
import { Order } from './order/entities/order.entity';
import { OrderItem } from './order/entities/order-item.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5434, // <--- PUERTO DEL DOCKER DE ORDER-SERVICE
      username: 'postgres',
      password: '123',
      database: 'order_db',
      entities: [Order, OrderItem], // Registramos las dos entidades
      synchronize: true, // Crea las tablas automáticamente
    }),
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
