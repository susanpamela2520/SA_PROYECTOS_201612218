import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 'AuthService' es el nombre del servicio en el .proto
  // 'Register' es el nombre del rpc
  @GrpcMethod('AuthService', 'Register')
  async register(data: any) {
    console.log('Solicitud gRPC recibida:', data);
    return await this.authService.register(data);
  }

  // ... imports anteriores
  @GrpcMethod('AuthService', 'Login') // <--- Nuevo endpoint gRPC
  async login(data: any) {
    return await this.authService.login(data);
  }

  @GrpcMethod('AuthService', 'Validate')
  async validate(data: { token: string }) {
    return await this.authService.validate(data.token);
  }
}
