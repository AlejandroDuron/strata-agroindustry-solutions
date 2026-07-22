import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase, seedRoles } from './utils/test-app';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
    await seedRoles(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/register and /auth/login flow', async () => {
    const registerDto = {
      email: 'postman@example.com',
      password: 'securePassword',
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201)
      .expect((response) => {
        expect(response.body.email).toBe(registerDto.email);
        expect(response.body.passwordHash).toBeUndefined();
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: registerDto.email, password: registerDto.password })
      .expect(200);

    expect(loginResponse.body.access_token).toBeDefined();
  });

  it('should reject login with an invalid password', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'wrongpass@example.com', password: 'securePassword' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'wrongpass@example.com', password: 'incorrectPassword' })
      .expect(401);
  });

  it('should reject registration with an invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'not-an-email', password: '123' })
      .expect(400);
  });
});
