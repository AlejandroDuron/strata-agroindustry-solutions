import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, resetDatabase } from './utils/test-app';
import { authHeader } from './utils/build-token';

describe('CropsController (e2e)', () => {
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
    await request(app.getHttpServer()).get('/crops').expect(401);
  });

  it('should reject creation from an operador (403)', async () => {
    await request(app.getHttpServer())
      .post('/crops')
      .set('Authorization', await authHeader(app, 'operador'))
      .send({ type: 'Coffee', variety: 'Arabica' })
      .expect(403);
  });

  it('should reject update from an operador (403)', async () => {
    const adminAuth = await authHeader(app, 'admin');

    const created = await request(app.getHttpServer())
      .post('/crops')
      .set('Authorization', adminAuth)
      .send({ type: 'Sugarcane', variety: 'CP 72-2086' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/crops/${created.body.id}`)
      .set('Authorization', await authHeader(app, 'operador'))
      .send({ variety: 'Modified' })
      .expect(403);
  });

  it('should reject deletion from a gerente (403) and allow it from admin', async () => {
    const adminAuth = await authHeader(app, 'admin');

    const created = await request(app.getHttpServer())
      .post('/crops')
      .set('Authorization', adminAuth)
      .send({ type: 'Wheat', variety: 'Hard Red' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/crops/${created.body.id}`)
      .set('Authorization', await authHeader(app, 'gerente'))
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/crops/${created.body.id}`)
      .set('Authorization', adminAuth)
      .expect(200);
  });

  it('should create and then read a crop', async () => {
    const created = await request(app.getHttpServer())
      .post('/crops')
      .set('Authorization', await authHeader(app, 'gerente'))
      .send({ type: 'Coffee', variety: 'Arabica' })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/crops/${created.body.id}`)
      .set('Authorization', await authHeader(app, 'auditor'))
      .expect(200);
  });

  it('should return 409 for a duplicate type+variety', async () => {
    const adminAuth = await authHeader(app, 'admin');

    await request(app.getHttpServer())
      .post('/crops')
      .set('Authorization', adminAuth)
      .send({ type: 'Maize', variety: 'Yellow' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/crops')
      .set('Authorization', adminAuth)
      .send({ type: 'Maize', variety: 'Yellow' })
      .expect(409);
  });

  it('should return 404 for a crop that does not exist', async () => {
    await request(app.getHttpServer())
      .get('/crops/999')
      .set('Authorization', await authHeader(app, 'admin'))
      .expect(404);
  });

  it('should support hard delete with ?hard=true', async () => {
    const adminAuth = await authHeader(app, 'admin');

    const created = await request(app.getHttpServer())
      .post('/crops')
      .set('Authorization', adminAuth)
      .send({ type: 'Beans', variety: 'Red' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/crops/${created.body.id}?hard=true`)
      .set('Authorization', adminAuth)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/crops/${created.body.id}`)
      .set('Authorization', adminAuth)
      .expect(404);
  });
});
