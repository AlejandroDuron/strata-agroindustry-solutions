import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, resetDatabase } from './utils/test-app';
import { authHeader } from './utils/build-token';

describe('ProductionCycleController (e2e)', () => {
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

  /** Helper: create a farm + field + crop, returns their IDs */
  async function seedFieldAndCrop() {
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

    return { fieldId: fieldRes.body.id, cropId: cropRes.body.id };
  }

  it('should reject creation from an operador (403)', async () => {
    const { fieldId, cropId } = await seedFieldAndCrop();

    await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', await authHeader(app, 'operador'))
      .send({
        fieldId,
        cropId,
        sowingDate: '2026-01-15',
        expectedHarvestDate: '2026-06-15',
        estimatedYield: 30,
      })
      .expect(403);
  });

  it('should create a cycle and reject a second open cycle for the same field', async () => {
    const { fieldId, cropId } = await seedFieldAndCrop();
    const gerenteAuth = await authHeader(app, 'gerente');
    const dto = {
      fieldId,
      cropId,
      sowingDate: '2026-01-15',
      expectedHarvestDate: '2026-06-15',
      estimatedYield: 30,
    };

    await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', gerenteAuth)
      .send(dto)
      .expect(201);

    await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', gerenteAuth)
      .send(dto)
      .expect(400);
  });

  it('should reject closing a cycle without harvests', async () => {
    const { fieldId, cropId } = await seedFieldAndCrop();
    const adminAuth = await authHeader(app, 'admin');

    const created = await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', adminAuth)
      .send({
        fieldId,
        cropId,
        sowingDate: '2026-01-15',
        expectedHarvestDate: '2026-06-15',
        estimatedYield: 30,
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/production-cycle/${created.body.id}/close`)
      .set('Authorization', adminAuth)
      .expect(400);
  });

  it('should close a cycle and compute the financial summary', async () => {
    const { fieldId, cropId } = await seedFieldAndCrop();
    const adminAuth = await authHeader(app, 'admin');

    const created = await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', adminAuth)
      .send({
        fieldId,
        cropId,
        sowingDate: '2026-01-15',
        expectedHarvestDate: '2026-06-15',
        estimatedYield: 30,
      })
      .expect(201);

    // Add a harvest
    await request(app.getHttpServer())
      .post('/harvests')
      .set('Authorization', await authHeader(app, 'operador'))
      .send({
        cycleId: created.body.id,
        quantityObtained: 20,
        quality: 'A',
        unitSalePrice: 100,
        quantitySold: 18,
      })
      .expect(201);

    // Add an input
    await request(app.getHttpServer())
      .post(`/production-cycles/${created.body.id}/inputs`)
      .set('Authorization', await authHeader(app, 'operador'))
      .send({
        name: 'Urea',
        type: 'FERTILIZER',
        quantity: 5,
        unitCost: 20,
        unit: 'kg',
        applicationDate: '2026-02-01',
      })
      .expect(201);

    // Close the cycle
    const closeResponse = await request(app.getHttpServer())
      .patch(`/production-cycle/${created.body.id}/close`)
      .set('Authorization', await authHeader(app, 'gerente'))
      .expect(200);

    expect(closeResponse.body.cycle.status).toBe('CLOSED');
    expect(closeResponse.body.cycle.totalRevenueAtClose).toBe(18 * 100);
    expect(closeResponse.body.cycle.totalCostAtClose).toBe(5 * 20);
    expect(closeResponse.body.realYield).toBe(20);
  });

  it('should reject deletion from a gerente and allow it from admin', async () => {
    const { fieldId, cropId } = await seedFieldAndCrop();
    const adminAuth = await authHeader(app, 'admin');

    const created = await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', adminAuth)
      .send({
        fieldId,
        cropId,
        sowingDate: '2026-01-15',
        expectedHarvestDate: '2026-06-15',
        estimatedYield: 30,
      })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/production-cycle/${created.body.id}`)
      .set('Authorization', await authHeader(app, 'gerente'))
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/production-cycle/${created.body.id}`)
      .set('Authorization', adminAuth)
      .expect(200);
  });

  it('should reject deletion of a closed cycle with 400', async () => {
    const { fieldId, cropId } = await seedFieldAndCrop();
    const adminAuth = await authHeader(app, 'admin');

    const created = await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', adminAuth)
      .send({
        fieldId,
        cropId,
        sowingDate: '2026-01-15',
        expectedHarvestDate: '2026-06-15',
        estimatedYield: 30,
      })
      .expect(201);

    // Add harvest and close
    await request(app.getHttpServer())
      .post('/harvests')
      .set('Authorization', adminAuth)
      .send({ cycleId: created.body.id, quantityObtained: 10, quality: 'A', unitSalePrice: 100, quantitySold: 8 })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/production-cycle/${created.body.id}/close`)
      .set('Authorization', adminAuth)
      .expect(200);

    // Try to delete the closed cycle
    await request(app.getHttpServer())
      .delete(`/production-cycle/${created.body.id}`)
      .set('Authorization', adminAuth)
      .expect(400);
  });

  it('should support hard delete with ?hard=true', async () => {
    const { fieldId, cropId } = await seedFieldAndCrop();
    const adminAuth = await authHeader(app, 'admin');

    const created = await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', adminAuth)
      .send({
        fieldId,
        cropId,
        sowingDate: '2026-01-15',
        expectedHarvestDate: '2026-06-15',
        estimatedYield: 30,
      })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/production-cycle/${created.body.id}?hard=true`)
      .set('Authorization', adminAuth)
      .expect(200);

    // Should be completely gone
    await request(app.getHttpServer())
      .get(`/production-cycle/${created.body.id}`)
      .set('Authorization', adminAuth)
      .expect(404);
  });
});
