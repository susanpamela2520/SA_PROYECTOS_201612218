import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service';
import { User } from './user.entity';

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('debe registrar un usuario correctamente', async () => {
      const payload = {
        email: 'test@mail.com',
        password: '123456',
        firstName: 'Diego',
        lastName: 'Juarez',
        role: 'customer',
      };

      mockUsersRepository.findOne.mockResolvedValue(null);
      mockUsersRepository.save.mockResolvedValue({
        id: 1,
        ...payload,
        password: 'hashedPassword',
      });

      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register(payload);

      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { email: payload.email },
      });
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(payload.password, 'salt');
      expect(mockUsersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          password: 'hashedPassword',
          role: payload.role,
        }),
      );
      expect(result).toEqual({
        status: HttpStatus.CREATED,
        error: null,
        userId: 1,
      });
    });

    it('debe retornar conflicto si el correo ya existe', async () => {
      const payload = {
        email: 'test@mail.com',
        password: '123456',
        firstName: 'Diego',
        lastName: 'Juarez',
        role: 'customer',
      };

      mockUsersRepository.findOne.mockResolvedValue({
        id: 1,
        email: payload.email,
      });

      const result = await service.register(payload);

      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { email: payload.email },
      });
      expect(mockUsersRepository.save).not.toHaveBeenCalled();
      expect(result).toEqual({
        status: HttpStatus.CONFLICT,
        error: 'El correo electrónico ya está registrado',
        userId: null,
      });
    });

    it('debe retornar internal server error si falla el save', async () => {
      const payload = {
        email: 'test@mail.com',
        password: '123456',
        firstName: 'Diego',
        lastName: 'Juarez',
        role: 'customer',
      };

      mockUsersRepository.findOne.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUsersRepository.save.mockRejectedValue(new Error('db error'));

      const result = await service.register(payload);

      expect(result).toEqual({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Error al crear el usuario: db error',
        userId: null,
      });
    });
  });

  describe('login', () => {
    it('debe retornar token si las credenciales son correctas', async () => {
      const payload = {
        email: 'test@mail.com',
        password: '123456',
      };

      const user = {
        id: 1,
        email: 'test@mail.com',
        password: 'hashedPassword',
        role: 'customer',
      };

      mockUsersRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('fake-jwt-token');

      const result = await service.login(payload);

      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { email: payload.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        payload.password,
        user.password,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      expect(result).toEqual({
        status: HttpStatus.OK,
        error: null,
        token: 'fake-jwt-token',
      });
    });

    it('debe retornar not found si el usuario no existe', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      const result = await service.login({
        email: 'noexiste@mail.com',
        password: '123456',
      });

      expect(result).toEqual({
        status: HttpStatus.NOT_FOUND,
        error: ['Usuario no encontrado'],
        token: null,
      });
    });

    it('debe retornar unauthorized si la contraseña es incorrecta', async () => {
      const payload = {
        email: 'test@mail.com',
        password: 'wrong-password',
      };

      mockUsersRepository.findOne.mockResolvedValue({
        id: 1,
        email: payload.email,
        password: 'hashedPassword',
        role: 'customer',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.login(payload);

      expect(result).toEqual({
        status: HttpStatus.UNAUTHORIZED,
        error: ['Contraseña incorrecta'],
        token: null,
      });
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('validate', () => {
    it('debe validar correctamente un token válido', async () => {
      const token = 'valid-token';

      mockJwtService.verify.mockReturnValue({
        userId: 1,
        email: 'test@mail.com',
        role: 'customer',
      });

      mockUsersRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'test@mail.com',
        role: 'customer',
      });

      const result = await service.validate(token);

      expect(mockJwtService.verify).toHaveBeenCalledWith(token);
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual({
        status: HttpStatus.OK,
        error: null,
        userId: 1,
        role: 'customer',
      });
    });

    it('debe retornar not found si el token es válido pero el usuario no existe', async () => {
      const token = 'valid-token';

      mockJwtService.verify.mockReturnValue({
        userId: 99,
        email: 'ghost@mail.com',
        role: 'customer',
      });

      mockUsersRepository.findOne.mockResolvedValue(null);

      const result = await service.validate(token);

      expect(result).toEqual({
        status: HttpStatus.NOT_FOUND,
        error: ['Usuario no encontrado'],
        userId: null,
        role: null,
      });
    });

    it('debe retornar unauthorized si el token es inválido o expiró', async () => {
      const token = 'invalid-token';

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      const result = await service.validate(token);

      expect(result).toEqual({
        status: HttpStatus.UNAUTHORIZED,
        error: ['Token inválido o expirado'],
        userId: null,
        role: null,
      });
      expect(mockUsersRepository.findOne).not.toHaveBeenCalled();
    });
  });
});
