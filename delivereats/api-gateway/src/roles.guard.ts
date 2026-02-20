import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Leer qué roles requiere esta ruta (según el decorador @Roles)
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si la ruta no tiene decorador @Roles, cualquiera puede entrar
    if (!requiredRoles) {
      return true;
    }

    // 2. Obtener el usuario (inyectado previamente por AuthGuard)
    const { user } = context.switchToHttp().getRequest();
    console.log('Required roles:', requiredRoles);
    console.log('User role:', user?.role);
    console.log('Match:', requiredRoles?.includes(user?.role));

    // 3. Verificar si el usuario tiene el rol necesario
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `No tienes permisos para esta acción. Requiere: ${requiredRoles.join(' o ')}`,
      );
    }

    return true;
  }
}
