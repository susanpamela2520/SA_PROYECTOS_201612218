import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import type { ClientGrpc } from '@nestjs/microservices';

import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  const mockClientGrpc = {
    getService: jest.fn().mockReturnValue(mockAuthService),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: 'AUTH_SERVICE',
          useValue: mockClientGrpc,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    controller.onModuleInit();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // =========================
  // REGISTER
  // =========================
  describe('register', () => {
    it('debe registrar correctamente', async () => {
      const body = { email: 'test@mail.com', password: '123' };

      mockAuthService.register.mockReturnValue(
        of({
          status: HttpStatus.CREATED,
          error: null,
          userId: 1,
        }),
      );

      const result = await controller.register(body);

      expect(mockAuthService.register).toHaveBeenCalledWith(body);
      expect(result).toEqual({
        status: HttpStatus.CREATED,
        error: null,
        userId: 1,
      });
    });

    it('debe lanzar HttpException si status != CREATED', async () => {
      mockAuthService.register.mockReturnValue(
        of({
          status: HttpStatus.CONFLICT,
          error: 'Usuario ya existe',
        }),
      );

      await expect(controller.register({})).rejects.toThrow(HttpException);
    });

    it('debe manejar error de comunicación', async () => {
      mockAuthService.register.mockReturnValue(
        throwError(() => new Error('gRPC error')),
      );

      await expect(controller.register({})).rejects.toThrow(
        new HttpException('gRPC error', HttpStatus.BAD_GATEWAY),
      );
    });
  });

  // =========================
  // LOGIN
  // =========================
  describe('login', () => {
    it('debe loguear correctamente', async () => {
      const body = { email: 'test@mail.com', password: '123' };

      mockAuthService.login.mockReturnValue(
        of({
          status: HttpStatus.OK,
          error: null,
          token: 'jwt-token',
        }),
      );

      const result = await controller.login(body);

      expect(result).toEqual({
        status: HttpStatus.OK,
        error: null,
        token: 'jwt-token',
      });
    });

    it('debe lanzar error si credenciales inválidas', async () => {
      mockAuthService.login.mockReturnValue(
        of({
          status: HttpStatus.UNAUTHORIZED,
          error: 'Credenciales inválidas',
        }),
      );

      await expect(controller.login({})).rejects.toThrow(HttpException);
    });

    it('debe manejar error inesperado', async () => {
      mockAuthService.login.mockReturnValue(
        throwError(() => new Error('fail')),
      );

      await expect(controller.login({})).rejects.toThrow(
        new HttpException('fail', HttpStatus.BAD_GATEWAY),
      );
    });
  });

  // =========================
  // PROFILE
  // =========================
  describe('getProfile', () => {
    it('debe retornar usuario autenticado', () => {
      const req = {
        user: {
          userId: 1,
          role: 'ADMIN',
        },
      };

      const result = controller.getProfile(req);

      expect(result).toEqual({
        message: 'Acceso autorizado a zona privada',
        user: req.user,
      });
    });
  });
});
