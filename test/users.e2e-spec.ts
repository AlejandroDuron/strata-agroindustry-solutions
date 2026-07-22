import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, resetDatabase } from './utils/test-app';
import { authHeader } from './utils/build-token';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(app);
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
      .set('Authorization', await authHeader(app, 'gerente'))
      .expect(403);
  });

  it('should allow admin to create and list users', async () => {
    const adminAuth = await authHeader(app, 'admin');

    const createResponse = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', adminAuth)
      .send({ email: 'nuevo@example.com', password: 'password123', role: 'operador' })
      .expect(201);

    expect(createResponse.body.email).toBe('nuevo@example.com');
    expect(createResponse.body.passwordHash).toBeUndefined();

    const listResponse = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', adminAuth)
      .expect(200);

    // The list includes the bootstrap admin + the created user + the admin we logged in as
    expect(listResponse.body.length).toBeGreaterThanOrEqual(2);
  });

  it('should return 404 when deleting a non-existent user', async () => {
    await request(app.getHttpServer())
      .delete('/users/999')
      .set('Authorization', await authHeader(app, 'admin'))
      .expect(404);
  });

  it('should support hard delete with ?hard=true', async () => {
    const adminAuth = await authHeader(app, 'admin');

    const createResponse = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', adminAuth)
      .send({ email: 'harddelete@example.com', password: 'password123', role: 'operador' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/users/${createResponse.body.id}?hard=true`)
      .set('Authorization', adminAuth)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/users/${createResponse.body.id}`)
      .set('Authorization', adminAuth)
      .expect(404);
  });
});
