import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase } from './utils/test-app';
import { authHeader } from './utils/build-token';

describe('ReportsController (e2e)', () => {
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

  /** Creates a full closed cycle with harvest/inputs for reporting */
  async function seedClosedCycle() {
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
        sowingDate: '2025-01-01',
        expectedHarvestDate: '2025-06-01',
        estimatedYield: 25,
      })
      .expect(201);

    // Add harvest
    await request(app.getHttpServer())
      .post('/harvests')
      .set('Authorization', authHeader('admin'))
      .send({
        cycleId: cycleRes.body.id,
        quantityObtained: 26,
        quality: 'A',
        unitSalePrice: 50,
        quantitySold: 20,
      })
      .expect(201);

    // Add input
    await request(app.getHttpServer())
      .post(`/production-cycles/${cycleRes.body.id}/inputs`)
      .set('Authorization', authHeader('admin'))
      .send({
        name: 'Urea',
        type: 'FERTILIZER',
        quantity: 10,
        unitCost: 40,
        unit: 'kg',
        applicationDate: '2025-02-01',
      })
      .expect(201);

    // Close cycle
    await request(app.getHttpServer())
      .patch(`/production-cycle/${cycleRes.body.id}/close`)
      .set('Authorization', authHeader('admin'))
      .expect(200);

    return { fieldId: fieldRes.body.id, cycleId: cycleRes.body.id };
  }

  it('should reject requests from an operador (403)', async () => {
    await request(app.getHttpServer())
      .get('/reports/yield-history?fieldId=1')
      .set('Authorization', authHeader('operador'))
      .expect(403);
  });

  it('should return 400 when fieldId is missing', async () => {
    await request(app.getHttpServer())
      .get('/reports/yield-history')
      .set('Authorization', authHeader('auditor'))
      .expect(400);
  });

  it('should return 404 when there is no data for the field', async () => {
    await request(app.getHttpServer())
      .get('/reports/yield-history?fieldId=999')
      .set('Authorization', authHeader('auditor'))
      .expect(404);
  });

  it('should return the yield history for an existing field', async () => {
    const { fieldId } = await seedClosedCycle();

    const response = await request(app.getHttpServer())
      .get(`/reports/yield-history?fieldId=${fieldId}`)
      .set('Authorization', authHeader('auditor'))
      .expect(200);

    expect(response.body.fieldId).toBe(fieldId);
    expect(response.body.history).toHaveLength(1);
  });

  it('should return the financial summary', async () => {
    await seedClosedCycle();

    const response = await request(app.getHttpServer())
      .get('/reports/financial')
      .set('Authorization', authHeader('gerente'))
      .expect(200);

    expect(response.body.totalClosedCycles).toBe(1);
    expect(response.body.totalRevenue).toBe(20 * 50); // quantitySold * unitSalePrice
  });
});
