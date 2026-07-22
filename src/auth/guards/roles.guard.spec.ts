import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

const createContext = (user: any): ExecutionContext =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const result = guard.canActivate(createContext({ role: { name: 'operador' } }));

    expect(result).toBe(true);
  });

  it('should allow access when the user role (object) is included', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin', 'gerente']);

    const result = guard.canActivate(createContext({ role: { name: 'gerente' } }));

    expect(result).toBe(true);
  });

  it('should allow access when the user role (string) is included', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);

    const result = guard.canActivate(createContext({ role: 'admin' }));

    expect(result).toBe(true);
  });

  it('should deny access when the user role is not included', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);

    const result = guard.canActivate(createContext({ role: { name: 'operador' } }));

    expect(result).toBe(false);
  });

  it('should deny access when there is no user role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);

    const result = guard.canActivate(createContext({}));

    expect(result).toBe(false);
  });
});
