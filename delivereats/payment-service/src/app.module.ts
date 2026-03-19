import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentModule } from './payment/payment.module';
import { ConfigModule } from '@nestjs/config';
import { Wallet } from './payment/entities/wallet.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST_PAYMENT,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME_PAYMENT,
      entities: [Wallet],
      synchronize: true,
      ssl: false,
    }),
    PaymentModule,
  ],
})
export class AppModule {}
