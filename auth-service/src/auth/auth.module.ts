import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthService } from './auth.service';
import { AuthGrpcController } from './auth.grpc.controller';

import { User } from '../users/user.entity';
import { UserRepository } from '../users/user.repository';

import { PasswordService } from '../security/password.service';
import { JwtTokenService } from '../security/jwt-token.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get('JWT_SECRET'),
        signOptions: { expiresIn: cfg.get('JWT_EXPIRES') || '1h' },
      }),
    }),
  ],
  controllers: [AuthGrpcController],
  providers: [AuthService, UserRepository, PasswordService, JwtTokenService],
})
export class AuthModule {}
