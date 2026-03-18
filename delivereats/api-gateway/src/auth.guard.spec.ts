import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { of, throwError } from 'rxjs';

import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  const mockAuthService = {
    validate: jest.fn(),
  };

  const mockClientGrpc = {
    getService: jest.fn().mockReturnValue(mockAuthService),
  };

  const createMockExecutionContext = (headers = {}) => {
    const request = { headers, user: undefined };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      request,
    } as any;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: 'AUTH_SERVICE',
          useValue: mockClientGrpc,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    guard.onModuleInit();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('debe validar token correctamente', async () => {
    const context = createMockExecutionContext({
      authorization: 'Bearer valid-token',
    });

    mockAuthService.validate.mockReturnValue(
      of({
        status: 200,
        userId: 1,
        role: 'Administrador',
      }),
    );

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(context.request.user).toEqual({
      userId: 1,
      role: 'Administrador',
    });
  });

  it('debe lanzar error si no hay header', async () => {
    const context = createMockExecutionContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debe lanzar error si token es inválido', async () => {
    const context = createMockExecutionContext({
      authorization: 'Bearer bad-token',
    });

    mockAuthService.validate.mockReturnValue(
      of({
        status: 401,
        error: 'invalid',
      }),
    );

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debe lanzar error si falla gRPC', async () => {
    const context = createMockExecutionContext({
      authorization: 'Bearer token',
    });

    mockAuthService.validate.mockReturnValue(
      throwError(() => new Error('gRPC error')),
    );

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
