import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

// Definimos la interfaz aquí para que el Guard sepa qué devuelve gRPC
interface AuthServiceClient {
  validate(data: { token: string }): any;
}

interface ValidateResponse {
  status: number;
  error: string[] | null;
  userId: number;
  role: string;
}

@Injectable()
export class AuthGuard implements CanActivate, OnModuleInit {
  private authService: AuthServiceClient;

  constructor(@Inject('AUTH_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceClient>('AuthService');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Extraer el token del header "Authorization"
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException(
        'No se proporcionó token de autorización',
      );
    }

    // El formato suele ser "Bearer <token>", así que quitamos "Bearer "
    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Token con formato inválido');
    }

    try {
      // 2. Llamar al microservicio Auth para validar
      const response = (await lastValueFrom(
        this.authService.validate({ token }),
      )) as ValidateResponse;

      // 3. Si el Auth-Service dice que no es válido (status != 200)
      if (response.status !== 200) {
        throw new UnauthorizedException(response.error || 'Token inválido');
      }

      // 4. ¡ÉXITO! Inyectamos el usuario en la request para usarlo luego
      // Esto es súper útil: en tus controladores podrás hacer request.user.userId
      request.user = {
        userId: response.userId,
        role: response.role,
      };

      return true; // Deja pasar la petición
    } catch (error) {
      throw new UnauthorizedException('Error al validar el token');
    }
  }
}
