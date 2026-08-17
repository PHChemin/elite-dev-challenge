import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

function handler() {}
class TestController {}

function createContext(role?: Role): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => TestController,
    switchToHttp: () => ({
      getRequest: () => ({
        user: role ? { id: 'user-1', email: 'u@x.com', role } : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const i18n = {
    t: jest.fn((key: string) => key),
  };
  const guard = new RolesGuard(
    reflector as unknown as Reflector,
    i18n as unknown as I18nService,
  );

  beforeEach(() => {
    reflector.getAllAndOverride.mockReset();
  });

  it('allows an organizer token on an organizer route', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.organizer]);

    expect(guard.canActivate(createContext(Role.organizer))).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      expect.any(Function),
      expect.any(Function),
    ]);
  });

  it('rejects a customer token on an organizer route', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.organizer]);

    expect(() => guard.canActivate(createContext(Role.customer))).toThrow(
      ForbiddenException,
    );
  });
});
