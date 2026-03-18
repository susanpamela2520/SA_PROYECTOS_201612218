import { Module } from '@nestjs/common';
/* import { TypeOrmModule } from '@nestjs/typeorm'; */
import { FxModule } from './fx/fx.module';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.DB_HOST_REST,
      port: Number(process.env.DB_PORT),
      ttl: Number(process.env.DB_TTL),
    }),
    FxModule,
  ],
})
export class AppModule {}
