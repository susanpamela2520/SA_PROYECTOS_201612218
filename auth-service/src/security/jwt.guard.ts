import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) throw new UnauthorizedException('Falta token');

    const token = auth.slice(7);
    try {
      req.user = this.jwt.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
