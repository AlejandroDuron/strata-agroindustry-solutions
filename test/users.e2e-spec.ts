import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase, seedRoles } from './utils/test-app';
import { authHeader } from './utils/build-token';

describe('UsersController (e2e)', () => {
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

  it('should reject requests without a token', async () => {
    await request(app.getHttpServer()).get('/users').expect(401);
  });

  it('should reject non-admin roles', async () => {
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', authHeader('gerente'))
      .expect(403);
  });

  it('should allow admin to create and list users', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', authHeader('admin'))
      .send({ email: 'nuevo@example.com', password: 'password123', role: 'operador' })
      .expect(201);

    expect(createResponse.body.email).toBe('nuevo@example.com');
    expect(createResponse.body.passwordHash).toBeUndefined();

    const listResponse = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', authHeader('admin'))
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
  });

  it('should return 404 when deleting a non-existent user', async () => {
    await request(app.getHttpServer())
      .delete('/users/999')
      .set('Authorization', authHeader('admin'))
      .expect(404);
  });
});
