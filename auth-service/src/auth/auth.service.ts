import { Injectable } from '@nestjs/common';
import { UserRepository } from '../users/user.repository';
import { PasswordService } from '../security/password.service';
import { JwtTokenService } from '../security/jwt-token.service';

@Injectable()
export class AuthService {
  constructor(
    private users: UserRepository,
    private pass: PasswordService,
    private tokens: JwtTokenService,
  ) {}

  async register(dto: any) {
    const exists = await this.users.findByEmail(dto.email);
    if (exists) return { ok: false, message: 'Email ya registrado', token: '' };

    const passwordHash = await this.pass.hash(dto.password);

    await this.users.createAndSave({
      email: dto.email,
      passwordHash,
      rol: dto.role,
      nombreCompleto: dto.nombreCompleto,
      telefono: dto.telefono,
    });

    return { ok: true, message: 'Registro exitoso', token: '' };
  }

  async login(dto: any) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) return { ok: false, message: 'Credenciales inválidas', token: '' };

    const okPass = await this.pass.compare(dto.password, user.passwordHash);
    if (!okPass) return { ok: false, message: 'Credenciales inválidas', token: '' };

    const token = this.tokens.sign({ sub: user.id, role: user.rol, email: user.email });

    return { ok: true, message: 'Login OK', token };
  }
}