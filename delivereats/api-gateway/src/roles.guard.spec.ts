import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockContext = (user = null) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as any;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    guard = new RolesGuard(reflector);
  });

  it('debe permitir acceso si no hay roles requeridos', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

    const result = guard.canActivate(mockContext());

    expect(result).toBe(true);
  });

  it('debe permitir acceso si el usuario tiene el rol', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      'Administrador',
    ]);

    const context = mockContext({ role: 'Administrador' });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('debe bloquear si no tiene el rol', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      'Administrador',
    ]);

    const context = mockContext({ role: 'USER' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('debe bloquear si no hay user', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      'Administrador',
    ]);

    const context = mockContext(null);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
