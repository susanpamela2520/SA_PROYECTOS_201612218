import { SetMetadata } from '@nestjs/common';

// Esta constante es la clave para leer los metadatos después
export const ROLES_KEY = 'roles';

// El decorador recibe una lista de roles (ej: 'ADMINISTRADOR', 'RESTAURANTE')
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
