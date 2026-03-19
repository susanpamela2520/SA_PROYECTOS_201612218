import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './restaurant/entities/restaurant.entity';
import { MenuItem } from './restaurant/entities/menu-item.entity';
import { RestaurantModule } from './restaurant/restaurant.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST_REST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME_REST,
      entities: [Restaurant, MenuItem],
      synchronize: true,
      ssl: false,
    }),
    RestaurantModule,
  ],
})
export class AppModule {}
