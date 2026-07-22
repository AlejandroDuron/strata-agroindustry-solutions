import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, resetDatabase } from './utils/test-app';
import { authHeader } from './utils/build-token';

describe('FarmsController (e2e)', () => {
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

  it('should reject requests without a token (401)', async () => {
    await request(app.getHttpServer()).get('/farms').expect(401);
    await request(app.getHttpServer()).post('/farms').send({ name: 'X', location: 'Y' }).expect(401);
  });

  it('should reject creation from an operador (403)', async () => {
    await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', await authHeader(app, 'operador'))
      .send({ name: 'Finca El Roble', location: 'Santa Ana' })
      .expect(403);
  });

  it('should reject update from an operador (403)', async () => {
    const adminAuth = await authHeader(app, 'admin');

    const created = await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', adminAuth)
      .send({ name: 'Finca Patch Test', location: 'San Salvador' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/farms/${created.body.id}`)
      .set('Authorization', await authHeader(app, 'operador'))
      .send({ name: 'Nombre Nuevo' })
      .expect(403);
  });

  it('should allow a gerente to create a farm and list it', async () => {
    await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', await authHeader(app, 'gerente'))
      .send({ name: 'Finca El Roble', location: 'Santa Ana' })
      .expect(201);

    const listResponse = await request(app.getHttpServer())
      .get('/farms')
      .set('Authorization', await authHeader(app, 'auditor'))
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].name).toBe('Finca El Roble');
  });

  it('should reject an invalid payload with 400', async () => {
    await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', await authHeader(app, 'admin'))
      .send({ name: '' })
      .expect(400);
  });

  it('should return 409 when creating a farm with a duplicate name', async () => {
    const adminAuth = await authHeader(app, 'admin');

    await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', adminAuth)
      .send({ name: 'Finca Duplicada', location: 'Sonsonate' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', adminAuth)
      .send({ name: 'Finca Duplicada', location: 'Sonsonate' })
      .expect(409);
  });

  it('should reject deletion from a gerente and allow it from admin', async () => {
    const adminAuth = await authHeader(app, 'admin');

    const created = await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', adminAuth)
      .send({ name: 'Finca a Eliminar', location: 'La Libertad' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/farms/${created.body.id}`)
      .set('Authorization', await authHeader(app, 'gerente'))
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/farms/${created.body.id}`)
      .set('Authorization', adminAuth)
      .expect(200);
  });

  it('should support hard delete with ?hard=true', async () => {
    const adminAuth = await authHeader(app, 'admin');

    const created = await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', adminAuth)
      .send({ name: 'Finca Hard Delete', location: 'La Libertad' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/farms/${created.body.id}?hard=true`)
      .set('Authorization', adminAuth)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/farms/${created.body.id}`)
      .set('Authorization', adminAuth)
      .expect(404);
  });
});
