import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, UserStatus } from '@prisma/client';
import { hash } from 'bcryptjs';
import { SEED_USERS } from '../../prisma/seed-users';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  };
  const jwt = {
    signAsync: jest.fn(),
  };

  const usersByEmail = new Map<
    string,
    {
      id: string;
      email: string;
      passwordHash: string;
      role: Role;
      status: UserStatus;
    }
  >();

  beforeAll(async () => {
    for (const seed of SEED_USERS) {
      usersByEmail.set(seed.email, {
        id: `user-${seed.role}`,
        email: seed.email,
        passwordHash: await hash(seed.password, 4),
        role: seed.role,
        status: UserStatus.active,
      });
    }
  });

  beforeEach(async () => {
    jwt.signAsync.mockReset();
    jwt.signAsync.mockImplementation((payload: { sub: string }) => {
      return Promise.resolve(`token-for-${payload.sub}`);
    });
    prisma.user.findUnique.mockReset();
    prisma.user.findUnique.mockImplementation(
      ({ where }: { where: { email?: string } }) => {
        if (!where.email) {
          return null;
        }
        return usersByEmail.get(where.email) ?? null;
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it.each(SEED_USERS)(
    'logs in seed $role and returns accessToken plus user.role',
    async (seed) => {
      const result = await service.login({
        email: seed.email,
        password: seed.password,
      });

      expect(result.accessToken).toBe(`token-for-user-${seed.role}`);
      expect(result.user).toEqual({
        id: `user-${seed.role}`,
        email: seed.email,
        role: seed.role,
      });
      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: `user-${seed.role}`,
        role: seed.role,
      });
    },
  );

  it('rejects a wrong password with 401', async () => {
    const admin = SEED_USERS.find((user) => user.role === Role.admin);
    if (!admin) {
      throw new Error('admin seed missing');
    }

    await expect(
      service.login({ email: admin.email, password: 'senha-errada' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('rejects an unknown email with 401', async () => {
    await expect(
      service.login({
        email: 'nobody@phctickets.local',
        password: 'admin123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });
});
