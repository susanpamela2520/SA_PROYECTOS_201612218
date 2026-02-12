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
    console.log('🔍 Buscando usuario:', dto.email);

    const user = await this.users.findByEmail(dto.email);

    if (!user) {
      console.log('❌ Usuario NO encontrado');
      return { ok: false, message: 'Credenciales inválidas', token: '' };
    }

    console.log('✅ Usuario encontrado:', user.email);
    console.log('📊 Rol:', user.rol);
    console.log('🔐 Hash almacenado:', user.passwordHash.substring(0, 30) + '...');
    console.log('🔑 Contraseña recibida:', dto.password);

    const okPass = await this.pass.compare(dto.password, user.passwordHash);

    console.log('🎯 Resultado comparación:', okPass);

    if (!okPass) {
      console.log('❌ Contraseña incorrecta');
      return { ok: false, message: 'Credenciales inválidas', token: '' };
    }

    console.log('✅ Contraseña correcta, generando token...');

    const role = String(user.rol || '');

    const token = this.tokens.sign({
      sub: user.id,
      role: role,
      email: user.email,
    });

    console.log('🎫 Token generado exitosamente');
    console.log('📦 Respuesta que se enviará:', {
      ok: true,
      userEmail: user.email,
      userRole: role,
      tokenLength: token.length,
    });

    return {
      ok: true,
      message: 'Login OK',
      token,
      user: {
        email: user.email,
        role: role, // ✅ frontend usa user.role
        rol: role,  // ✅ por si algún lado usa user.rol
        nombreCompleto: user.nombreCompleto,
      },
    };
  }

  async generateHash(password: string) {
    return await this.pass.hash(password);
  }
}
