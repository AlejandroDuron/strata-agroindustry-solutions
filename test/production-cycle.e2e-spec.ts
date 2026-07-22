import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase } from './utils/test-app';
import { authHeader } from './utils/build-token';

describe('ProductionCycleController (e2e)', () => {
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

  /** Helper: create a farm + field + crop, returns their IDs */
  async function seedFieldAndCrop() {
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

    return { fieldId: fieldRes.body.id, cropId: cropRes.body.id };
  }

  it('should reject creation from an operador (403)', async () => {
    const { fieldId, cropId } = await seedFieldAndCrop();

    await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', authHeader('operador'))
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
    const dto = {
      fieldId,
      cropId,
      sowingDate: '2026-01-15',
      expectedHarvestDate: '2026-06-15',
      estimatedYield: 30,
    };

    await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', authHeader('gerente'))
      .send(dto)
      .expect(201);

    await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', authHeader('gerente'))
      .send(dto)
      .expect(400);
  });

  it('should reject closing a cycle without harvests', async () => {
    const { fieldId, cropId } = await seedFieldAndCrop();

    const created = await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', authHeader('admin'))
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
      .set('Authorization', authHeader('admin'))
      .expect(400);
  });

  it('should close a cycle and compute the financial summary', async () => {
    const { fieldId, cropId } = await seedFieldAndCrop();

    const created = await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', authHeader('admin'))
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
      .set('Authorization', authHeader('operador'))
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
      .set('Authorization', authHeader('operador'))
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
      .set('Authorization', authHeader('gerente'))
      .expect(200);

    expect(closeResponse.body.cycle.status).toBe('CLOSED');
    expect(closeResponse.body.cycle.totalRevenueAtClose).toBe(18 * 100);
    expect(closeResponse.body.cycle.totalCostAtClose).toBe(5 * 20);
    expect(closeResponse.body.realYield).toBe(20);
  });

  it('should reject deletion from a gerente and allow it from admin', async () => {
    const { fieldId, cropId } = await seedFieldAndCrop();

    const created = await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', authHeader('admin'))
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
      .set('Authorization', authHeader('gerente'))
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/production-cycle/${created.body.id}`)
      .set('Authorization', authHeader('admin'))
      .expect(200);
  });
});
