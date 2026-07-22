import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase } from './utils/test-app';
import { authHeader } from './utils/build-token';

describe('HarvestsController (e2e)', () => {
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

  /** Creates farm → field → crop → open cycle, returns cycleId */
  async function seedOpenCycle(): Promise<number> {
    const farmRes = await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', authHeader('admin'))
      .send({ name: 'Finca Test', location: 'Santa Ana' })
      .expect(201);

    const fieldRes = await request(app.getHttpServer())
      .post('/fields')
      .set('Authorization', authHeader('admin'))
      .send({ farmId: farmRes.body.id, name: 'Lote 1', area: 5 })
      .expect(201);

    const cropRes = await request(app.getHttpServer())
      .post('/crops')
      .set('Authorization', authHeader('admin'))
      .send({ type: 'Coffee', variety: 'Arabica' })
      .expect(201);

    const cycleRes = await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', authHeader('admin'))
      .send({
        fieldId: fieldRes.body.id,
        cropId: cropRes.body.id,
        sowingDate: '2026-01-15',
        expectedHarvestDate: '2026-06-15',
        estimatedYield: 30,
      })
      .expect(201);

    return cycleRes.body.id;
  }

  /** Creates an open cycle and closes it, returns the closed cycle ID */
  async function seedClosedCycle(): Promise<number> {
    const cycleId = await seedOpenCycle();

    // Add a harvest so we can close
    await request(app.getHttpServer())
      .post('/harvests')
      .set('Authorization', authHeader('admin'))
      .send({ cycleId, quantityObtained: 10, quality: 'B', unitSalePrice: 50, quantitySold: 8 })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/production-cycle/${cycleId}/close`)
      .set('Authorization', authHeader('admin'))
      .expect(200);

    return cycleId;
  }

  const validDto = { quantityObtained: 25.5, quality: 'A', unitSalePrice: 120, quantitySold: 22 };

  it('should reject creation from an auditor (403)', async () => {
    const cycleId = await seedOpenCycle();

    await request(app.getHttpServer())
      .post('/harvests')
      .set('Authorization', authHeader('auditor'))
      .send({ ...validDto, cycleId })
      .expect(403);
  });

  it('should allow an operador to register a harvest on an open cycle', async () => {
    const cycleId = await seedOpenCycle();

    const response = await request(app.getHttpServer())
      .post('/harvests')
      .set('Authorization', authHeader('operador'))
      .send({ ...validDto, cycleId })
      .expect(201);

    expect(response.body.quantityObtained).toBe(25.5);
  });

  it('should reject a harvest on a closed cycle with 400', async () => {
    const cycleId = await seedClosedCycle();

    await request(app.getHttpServer())
      .post('/harvests')
      .set('Authorization', authHeader('admin'))
      .send({ ...validDto, cycleId })
      .expect(400);
  });

  it('should allow an operador to update a harvest', async () => {
    const cycleId = await seedOpenCycle();

    const created = await request(app.getHttpServer())
      .post('/harvests')
      .set('Authorization', authHeader('admin'))
      .send({ ...validDto, cycleId })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/harvests/${created.body.id}`)
      .set('Authorization', authHeader('operador'))
      .send({ quantityObtained: 30 })
      .expect(200);
  });

  it('should reject deletion from an operador and allow it from admin', async () => {
    const cycleId = await seedOpenCycle();

    const created = await request(app.getHttpServer())
      .post('/harvests')
      .set('Authorization', authHeader('admin'))
      .send({ ...validDto, cycleId })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/harvests/${created.body.id}`)
      .set('Authorization', authHeader('operador'))
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/harvests/${created.body.id}`)
      .set('Authorization', authHeader('admin'))
      .expect(200);
  });
});
