import { INestApplication, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role, UserStatus } from '@prisma/client';
import { hash } from 'bcryptjs';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { setupApp } from '../../src/common/setup-app';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SEED_USERS } from '../../prisma/seed-users';

export type SeedUserRow = {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  organizerId: string | null;
  mustChangePassword: boolean;
};

export type LoginBody = {
  accessToken: string;
  user: { id: string; email: string; role: Role };
};

export type ProfileBody = {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  organizerId: string | null;
  mustChangePassword: boolean;
};

type UserWhere = { id?: string; email?: string };
type UserSelect = Partial<Record<keyof SeedUserRow, boolean>>;

function pickUser(
  user: SeedUserRow,
  select?: UserSelect,
): SeedUserRow | Record<string, unknown> {
  if (!select) {
    return user;
  }
  const picked: Record<string, unknown> = {};
  for (const key of Object.keys(select) as (keyof SeedUserRow)[]) {
    if (select[key]) {
      picked[key] = user[key];
    }
  }
  return picked;
}

export async function createSeedUsers(): Promise<SeedUserRow[]> {
  const organizerId = 'user-organizer';
  const users: SeedUserRow[] = [];
  for (const seed of SEED_USERS) {
    users.push({
      id: `user-${seed.role}`,
      email: seed.email,
      passwordHash: await hash(seed.password, 4),
      role: seed.role,
      status: UserStatus.active,
      organizerId: seed.role === Role.gate ? organizerId : null,
      mustChangePassword: false,
    });
  }
  return users;
}

export function createPrismaMock(users: SeedUserRow[]) {
  return {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    user: {
      findUnique: jest.fn(
        ({ where, select }: { where: UserWhere; select?: UserSelect }) => {
          const user = where.email
            ? (users.find((row) => row.email === where.email) ?? null)
            : where.id
              ? (users.find((row) => row.id === where.id) ?? null)
              : null;
          if (!user) {
            return null;
          }
          return pickUser(user, select);
        },
      ),
    },
  };
}

export async function createE2eApp(options?: {
  controllers?: Type<unknown>[];
}): Promise<{
  app: INestApplication;
  server: App;
  users: SeedUserRow[];
}> {
  const users = await createSeedUsers();
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    controllers: options?.controllers ?? [],
  })
    .overrideProvider(PrismaService)
    .useValue(createPrismaMock(users))
    .compile();

  const app = moduleRef.createNestApplication();
  setupApp(app);
  await app.init();

  return {
    app,
    server: app.getHttpServer() as App,
    users,
  };
}

export function readLoginBody(body: unknown): LoginBody {
  return body as LoginBody;
}

export function readProfileBody(body: unknown): ProfileBody {
  return body as ProfileBody;
}

export function decodeJwtPayload(token: string): { sub: string; role: Role } {
  const parts = token.split('.');
  const payload = parts[1];
  if (!payload) {
    throw new Error('token sem payload');
  }
  return JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
    sub: string;
    role: Role;
  };
}
