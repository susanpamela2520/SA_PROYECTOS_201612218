import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';
import { RegisterRequestDto } from './dto/register.dto'; // DTO basado en el proto
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  public async register(payload: RegisterRequestDto): Promise<any> {
    const { email, password, firstName, lastName, role } = payload;

    // 1. Validar si el usuario ya existe
    const userExists = await this.usersRepository.findOne({ where: { email } });

    if (userExists) {
      return {
        status: HttpStatus.CONFLICT,
        error: 'El correo electrónico ya está registrado',
        userId: null,
      };
    }

    // 2. Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Crear y guardar el usuario
    const newUser = new User();
    newUser.firstName = firstName;
    newUser.lastName = lastName;
    newUser.email = email;
    newUser.password = hashedPassword;
    newUser.role = role;

    try {
      const savedUser = await this.usersRepository.save(newUser);

      return {
        status: HttpStatus.CREATED,
        error: null,
        userId: savedUser.id,
      };
    } catch (e) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Error al crear el usuario: ' + e.message,
        userId: null,
      };
    }
  }

  public async login(payload: any): Promise<any> {
    const { email, password } = payload;

    // 1. Buscar usuario
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      return {
        status: HttpStatus.NOT_FOUND,
        error: ['Usuario no encontrado'],
        token: null,
      };
    }

    // 2. Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        error: ['Contraseña incorrecta'],
        token: null,
      };
    }

    // 3. Generar Token
    // Guardamos en el token el ID y el ROL (muy útil para validar permisos después)
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const token = this.jwtService.sign(tokenPayload);

    return {
      status: HttpStatus.OK,
      error: null,
      token: token,
    };
  }

  public async validate(token: string): Promise<any> {
    try {
      // 1. Verificar la firma del token
      // Si el token está vencido o la firma está mal, esto lanza una excepción automáticamente
      const decoded = this.jwtService.verify(token);

      // 2. Buscar si el usuario aún existe en la BD (Opcional pero recomendado por seguridad)
      const user = await this.usersRepository.findOne({
        where: { id: decoded.userId },
      });

      if (!user) {
        return {
          status: HttpStatus.NOT_FOUND,
          error: ['Usuario no encontrado'],
          userId: null,
          role: null,
        };
      }

      // 3. Token válido
      return {
        status: HttpStatus.OK,
        error: null,
        userId: user.id,
        role: user.role,
      };
    } catch (error) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        error: ['Token inválido o expirado'],
        userId: null,
        role: null,
      };
    }
  }
}
