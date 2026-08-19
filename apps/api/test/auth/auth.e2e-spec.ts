import { Controller, Get, INestApplication } from '@nestjs/common';
import { Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { Auth } from '../../src/auth/decorators/auth.decorator';
import { SEED_USERS, seedUserIdFromEmail } from '../../prisma/seed-users';
import {
  createE2eApp,
  decodeJwtPayload,
  readLoginBody,
} from '../helpers/e2e-app';

@Controller('test/organizer-only')
class OrganizerOnlyController {
  @Get()
  @Auth(Role.organizer)
  ping() {
    return { ok: true };
  }
}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let server: App;

  beforeAll(async () => {
    const created = await createE2eApp({
      controllers: [OrganizerOnlyController],
    });
    app = created.app;
    server = created.server;
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(SEED_USERS)(
    'POST /api/auth/login succeeds for seed $role',
    async (seed) => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({ email: seed.email, password: seed.password })
        .expect(200);

      const body = readLoginBody(response.body);
      expect(body.accessToken).toEqual(expect.any(String));
      const userId = seedUserIdFromEmail(seed.email);
      expect(body.user).toEqual({
        id: userId,
        email: seed.email,
        role: seed.role,
      });

      const payload = decodeJwtPayload(body.accessToken);
      expect(payload.sub).toBe(userId);
      expect(payload.role).toBe(seed.role);
    },
  );

  it('POST /api/auth/login rejects a wrong password with 401', async () => {
    const admin = SEED_USERS.find((user) => user.role === Role.admin);
    if (!admin) {
      throw new Error('admin seed missing');
    }

    const response = await request(server)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'senha-errada' })
      .expect(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      path: '/api/auth/login',
      fieldErrors: {},
    });
  });

  it('POST /api/auth/login returns fieldErrors for an invalid email', async () => {
    const response = await request(server)
      .post('/api/auth/login')
      .send({ email: 'nao-e-email', password: 'admin123' })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      path: '/api/auth/login',
      message: 'Dados inválidos',
      fieldErrors: {
        email: ['Informe um e-mail válido'],
      },
    });
  });

  it('GET /api/test/organizer-only accepts an organizer token', async () => {
    const organizer = SEED_USERS.find((user) => user.role === Role.organizer);
    if (!organizer) {
      throw new Error('organizer seed missing');
    }

    const login = await request(server)
      .post('/api/auth/login')
      .send({ email: organizer.email, password: organizer.password })
      .expect(200);
    const { accessToken } = readLoginBody(login.body);

    await request(server)
      .get('/api/test/organizer-only')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect({ ok: true });
  });

  it('GET /api/test/organizer-only rejects a customer token with 403', async () => {
    const customer = SEED_USERS.find((user) => user.role === Role.customer);
    if (!customer) {
      throw new Error('customer seed missing');
    }

    const login = await request(server)
      .post('/api/auth/login')
      .send({ email: customer.email, password: customer.password })
      .expect(200);
    const { accessToken } = readLoginBody(login.body);

    const response = await request(server)
      .get('/api/test/organizer-only')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);

    expect(response.body).toMatchObject({
      statusCode: 403,
      path: '/api/test/organizer-only',
      fieldErrors: {},
    });
  });
});
