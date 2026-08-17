import { INestApplication } from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { SEED_USERS } from '../../prisma/seed-users';
import {
  createE2eApp,
  readLoginBody,
  readProfileBody,
} from '../helpers/e2e-app';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let server: App;

  beforeAll(async () => {
    const created = await createE2eApp();
    app = created.app;
    server = created.server;
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(SEED_USERS)(
    'GET /api/users/me returns the $role profile without the password hash',
    async (seed) => {
      const login = await request(server)
        .post('/api/auth/login')
        .send({ email: seed.email, password: seed.password })
        .expect(200);
      const { accessToken } = readLoginBody(login.body);

      const response = await request(server)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = readProfileBody(response.body);
      expect(body).toEqual({
        id: `user-${seed.role}`,
        email: seed.email,
        role: seed.role,
        status: UserStatus.active,
        organizerId: seed.role === Role.gate ? 'user-organizer' : null,
        mustChangePassword: false,
      });
      expect(body).not.toHaveProperty('passwordHash');
    },
  );

  it('GET /api/users/me rejects a missing token with 401', async () => {
    const response = await request(server).get('/api/users/me').expect(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      path: '/api/users/me',
      fieldErrors: {},
    });
  });

  it('GET /api/users/me rejects an invalid token with 401', async () => {
    const response = await request(server)
      .get('/api/users/me')
      .set('Authorization', 'Bearer token-invalido')
      .expect(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      path: '/api/users/me',
      fieldErrors: {},
    });
  });
});
