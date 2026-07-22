import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase } from './utils/test-app';
import { authHeader } from './utils/build-token';

describe('FarmsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject creation from an operador (403)', async () => {
    await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', authHeader('operador'))
      .send({ name: 'Finca El Roble', location: 'Santa Ana' })
      .expect(403);
  });

  it('should allow a gerente to create a farm and list it', async () => {
    await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', authHeader('gerente'))
      .send({ name: 'Finca El Roble', location: 'Santa Ana' })
      .expect(201);

    const listResponse = await request(app.getHttpServer())
      .get('/farms')
      .set('Authorization', authHeader('auditor'))
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].name).toBe('Finca El Roble');
  });

  it('should reject an invalid payload with 400', async () => {
    await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', authHeader('admin'))
      .send({ name: '' })
      .expect(400);
  });

  it('should return 409 when creating a farm with a duplicate name', async () => {
    await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', authHeader('admin'))
      .send({ name: 'Finca Duplicada', location: 'Sonsonate' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', authHeader('admin'))
      .send({ name: 'Finca Duplicada', location: 'Sonsonate' })
      .expect(409);
  });

  it('should reject deletion from a gerente and allow it from admin', async () => {
    const created = await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', authHeader('admin'))
      .send({ name: 'Finca a Eliminar', location: 'La Libertad' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/farms/${created.body.id}`)
      .set('Authorization', authHeader('gerente'))
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/farms/${created.body.id}`)
      .set('Authorization', authHeader('admin'))
      .expect(200);
  });
});
