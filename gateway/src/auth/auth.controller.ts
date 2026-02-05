import { Controller, Post, Body } from '@nestjs/common';
import { AuthGrpcClient } from './auth.grpc.client';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authClient: AuthGrpcClient) {}

  @Post('register')
  async register(@Body() body: any) {
    try {
      const result = await this.authClient.register(body);
      return result;
    } catch (error) {
      console.error('Error en register:', error);
      return {
        ok: false,
        message: 'Error al registrar usuario',
      };
    }
  }

  @Post('login')
  async login(@Body() body: any) {
    try {
      const result = await this.authClient.login(body);
      return result;
    } catch (error) {
      console.error('Error en login:', error);
      return {
        ok: false,
        message: 'Error al iniciar sesión',
      };
    }
  }
}