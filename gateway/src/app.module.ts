import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth/auth.controller';
import { AuthGrpcClient } from './auth/auth.grpc.client';
import { JwtGuard } from './auth/jwt.guard';
import { ProtectedController } from './protected/protected.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController, ProtectedController],
  providers: [AuthGrpcClient, JwtGuard],
})
export class AppModule {}