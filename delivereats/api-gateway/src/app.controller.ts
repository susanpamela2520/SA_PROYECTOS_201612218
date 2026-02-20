import {
  Controller,
  Post,
  Get,
  Body,
  Inject,
  OnModuleInit,
  HttpException,
  HttpStatus,
  UseGuards, // <--- Agregar
  Req,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { AuthGuard } from './auth.guard';

interface RegisterResponse {
  status: number;
  error: string[] | null;
  userId: number;
}

interface LoginResponse {
  status: number;
  error: string[] | null;
  token: string;
}

interface AuthServiceClient {
  register(data: any): any;
  login(data: any): any;
}

@Controller('auth')
export class AppController implements OnModuleInit {
  private authService: AuthServiceClient;

  constructor(@Inject('AUTH_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceClient>('AuthService');
  }

  @Post('register')
  async register(@Body() body: any) {
    try {
      // CAMBIO 3: 'Casteamos' la respuesta para que TS sepa que tiene .status y .error
      const response = (await lastValueFrom(
        this.authService.register(body),
      )) as RegisterResponse;
      if (response.status !== HttpStatus.CREATED) {
        // CORRECCIÓN: Si response.error es null, usamos un texto por defecto
        throw new HttpException(
          response.error || 'Error desconocido al crear usuario',
          response.status,
        );
      }
      return response;
    } catch (error) {
      // Manejo seguro del error
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.BAD_GATEWAY;
      const message =
        error instanceof HttpException
          ? error.getResponse()
          : error.message || 'Error de comunicación';

      throw new HttpException(message, status);
    }
  }

  @Post('login')
  async login(@Body() body: any) {
    try {
      const response = (await lastValueFrom(
        this.authService.login(body),
      )) as LoginResponse;

      if (response.status !== HttpStatus.OK) {
        throw new HttpException(
          response.error || 'Error al iniciar sesión',
          response.status,
        );
      }

      return response;
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.BAD_GATEWAY;
      const message =
        error instanceof HttpException
          ? error.getResponse()
          : error.message || 'Error desconocido';
      throw new HttpException(message, status);
    }
  }

  @Get('profile')
  @UseGuards(AuthGuard) // <--- ¡Esto activa la seguridad!
  getProfile(@Req() req: any) {
    // Si llegamos aquí, es que el token era válido.
    // Devolvemos los datos que el Guard inyectó en la request.
    return {
      message: 'Acceso autorizado a zona privada',
      user: req.user, // Aquí vendrá el ID y el ROL
    };
  }
}
