import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, resetDatabase } from './utils/test-app';
import { authHeader } from './utils/build-token';

describe('FieldsController (e2e)', () => {
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

  async function createFarm(name = 'Finca Test'): Promise<number> {
    const res = await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', await authHeader(app, 'admin'))
      .send({ name, location: 'Test Location' })
      .expect(201);
    return res.body.id;
  }

  it('should reject creation from an operador (403)', async () => {
    const farmId = await createFarm();
    await request(app.getHttpServer())
      .post('/fields')
      .set('Authorization', await authHeader(app, 'operador'))
      .send({ farmId, name: 'Lote 1', area: 5.5 })
      .expect(403);
  });

  it('should create a field for an existing farm', async () => {
    const farmId = await createFarm();
    const response = await request(app.getHttpServer())
      .post('/fields')
      .set('Authorization', await authHeader(app, 'gerente'))
      .send({ farmId, name: 'Lote 1', area: 5.5 })
      .expect(201);

    expect(response.body.name).toBe('Lote 1');
  });

  it('should return 404 when the farm does not exist', async () => {
    await request(app.getHttpServer())
      .post('/fields')
      .set('Authorization', await authHeader(app, 'admin'))
      .send({ farmId: 999, name: 'Lote X', area: 2 })
      .expect(404);
  });

  it('should reject an area change with 409 while an open cycle exists', async () => {
    const adminAuth = await authHeader(app, 'admin');
    const farmId = await createFarm();

    const fieldRes = await request(app.getHttpServer())
      .post('/fields')
      .set('Authorization', adminAuth)
      .send({ farmId, name: 'Lote Con Ciclo', area: 5 })
      .expect(201);

    const cropRes = await request(app.getHttpServer())
      .post('/crops')
      .set('Authorization', adminAuth)
      .send({ type: 'Coffee', variety: 'Arabica' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', adminAuth)
      .send({
        fieldId: fieldRes.body.id,
        cropId: cropRes.body.id,
        sowingDate: '2026-01-15',
        expectedHarvestDate: '2026-06-15',
        estimatedYield: 30,
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/fields/${fieldRes.body.id}`)
      .set('Authorization', adminAuth)
      .send({ area: 10 })
      .expect(409);
  });

  it('should allow gerente to delete a field', async () => {
    const adminAuth = await authHeader(app, 'admin');
    const farmId = await createFarm();

    const created = await request(app.getHttpServer())
      .post('/fields')
      .set('Authorization', adminAuth)
      .send({ farmId, name: 'Lote a Eliminar', area: 3 })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/fields/${created.body.id}`)
      .set('Authorization', await authHeader(app, 'gerente'))
      .expect(200);
  });

  it('should support hard delete with ?hard=true', async () => {
    const adminAuth = await authHeader(app, 'admin');
    const farmId = await createFarm();

    const created = await request(app.getHttpServer())
      .post('/fields')
      .set('Authorization', adminAuth)
      .send({ farmId, name: 'Lote Hard Delete', area: 2 })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/fields/${created.body.id}?hard=true`)
      .set('Authorization', adminAuth)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/fields/${created.body.id}`)
      .set('Authorization', adminAuth)
      .expect(404);
  });
});
