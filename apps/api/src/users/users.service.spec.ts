import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    prisma.user.findUnique.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(UsersService);
  });

  it('returns the authenticated profile without the password hash', async () => {
    const profile = {
      id: 'user-customer',
      email: 'customer@phctickets.local',
      role: Role.customer,
      status: UserStatus.active,
      organizerId: null,
      mustChangePassword: false,
    };
    prisma.user.findUnique.mockResolvedValue(profile);

    await expect(service.findMe('user-customer')).resolves.toEqual(profile);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-customer' },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        organizerId: true,
        mustChangePassword: true,
      },
    });
  });

  it('rejects a missing user with 401', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.findMe('missing')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
