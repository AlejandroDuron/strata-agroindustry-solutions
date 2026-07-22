import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, resetDatabase } from './utils/test-app';
import { authHeader } from './utils/build-token';

describe('InputsController (e2e)', () => {
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

  /** Creates farm → field → crop → open cycle, returns cycleId */
  async function seedOpenCycle(): Promise<number> {
    const adminAuth = await authHeader(app, 'admin');

    const farmRes = await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', adminAuth)
      .send({ name: 'Finca Test', location: 'Santa Ana' })
      .expect(201);

    const fieldRes = await request(app.getHttpServer())
      .post('/fields')
      .set('Authorization', adminAuth)
      .send({ farmId: farmRes.body.id, name: 'Lote 1', area: 5 })
      .expect(201);

    const cropRes = await request(app.getHttpServer())
      .post('/crops')
      .set('Authorization', adminAuth)
      .send({ type: 'Coffee', variety: 'Arabica' })
      .expect(201);

    const cycleRes = await request(app.getHttpServer())
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

    return cycleRes.body.id;
  }

  async function seedClosedCycle(): Promise<number> {
    const adminAuth = await authHeader(app, 'admin');
    const cycleId = await seedOpenCycle();

    await request(app.getHttpServer())
      .post('/harvests')
      .set('Authorization', adminAuth)
      .send({ cycleId, quantityObtained: 10, quality: 'B', unitSalePrice: 50, quantitySold: 8 })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/production-cycle/${cycleId}/close`)
      .set('Authorization', adminAuth)
      .expect(200);

    return cycleId;
  }

  const validDto = {
    name: 'Urea 46%',
    type: 'FERTILIZER',
    quantity: 10,
    unitCost: 15,
    unit: 'kg',
    applicationDate: '2026-07-21',
  };

  it('should reject creation from an auditor (403)', async () => {
    const cycleId = await seedOpenCycle();

    await request(app.getHttpServer())
      .post(`/production-cycles/${cycleId}/inputs`)
      .set('Authorization', await authHeader(app, 'auditor'))
      .send(validDto)
      .expect(403);
  });

  it('should allow an operador to register an input and recalculate the cycle cost', async () => {
    const cycleId = await seedOpenCycle();

    const response = await request(app.getHttpServer())
      .post(`/production-cycles/${cycleId}/inputs`)
      .set('Authorization', await authHeader(app, 'operador'))
      .send(validDto)
      .expect(201);

    expect(response.body.name).toBe('Urea 46%');

    // Verify cost per area was recalculated: (10 * 15) / 5 = 30
    const cycleResponse = await request(app.getHttpServer())
      .get(`/production-cycle/${cycleId}`)
      .set('Authorization', await authHeader(app, 'admin'))
      .expect(200);

    expect(cycleResponse.body.currentCostPerArea).toBe(30);
  });

  it('should reject an input on a closed cycle with 400', async () => {
    const cycleId = await seedClosedCycle();

    await request(app.getHttpServer())
      .post(`/production-cycles/${cycleId}/inputs`)
      .set('Authorization', await authHeader(app, 'admin'))
      .send(validDto)
      .expect(400);
  });

  it('should allow an operador to update an input but not delete it', async () => {
    const cycleId = await seedOpenCycle();
    const adminAuth = await authHeader(app, 'admin');

    const created = await request(app.getHttpServer())
      .post(`/production-cycles/${cycleId}/inputs`)
      .set('Authorization', adminAuth)
      .send(validDto)
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/production-cycles/${cycleId}/inputs/${created.body.id}`)
      .set('Authorization', await authHeader(app, 'operador'))
      .send({ quantity: 20 })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/production-cycles/${cycleId}/inputs/${created.body.id}`)
      .set('Authorization', await authHeader(app, 'operador'))
      .expect(403);
  });

  it('should reject an input with applicationDate before the cycle sowingDate (400)', async () => {
    const cycleId = await seedOpenCycle();

    await request(app.getHttpServer())
      .post(`/production-cycles/${cycleId}/inputs`)
      .set('Authorization', await authHeader(app, 'admin'))
      .send({ ...validDto, applicationDate: '2025-12-01' })
      .expect(400);
  });

  it('should reject an input with more than 2 decimal places in unitCost (400)', async () => {
    const cycleId = await seedOpenCycle();

    await request(app.getHttpServer())
      .post(`/production-cycles/${cycleId}/inputs`)
      .set('Authorization', await authHeader(app, 'admin'))
      .send({ ...validDto, unitCost: 15.759 })
      .expect(400);
  });

  it('should reject an input with more than 2 decimal places in quantity (400)', async () => {
    const cycleId = await seedOpenCycle();

    await request(app.getHttpServer())
      .post(`/production-cycles/${cycleId}/inputs`)
      .set('Authorization', await authHeader(app, 'admin'))
      .send({ ...validDto, quantity: 10.123 })
      .expect(400);
  });
});
