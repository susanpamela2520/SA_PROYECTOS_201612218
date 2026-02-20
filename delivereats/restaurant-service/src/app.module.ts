import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './restaurant/entities/restaurant.entity';
import { MenuItem } from './restaurant/entities/menu-item.entity';
import { RestaurantModule } from './restaurant/restaurant.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'postgres',
      password: '123',
      database: 'restaurant_db',
      entities: [Restaurant, MenuItem],
      synchronize: true,
    }),
    RestaurantModule,
  ],
})
export class AppModule {}
