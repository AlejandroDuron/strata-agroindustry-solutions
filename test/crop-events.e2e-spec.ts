import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase } from './utils/test-app';
import { authHeader } from './utils/build-token';

describe('CropEventsController (e2e)', () => {
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

  async function seedClosedCycle(): Promise<number> {
    const cycleId = await seedOpenCycle();

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

  const validDto = { eventType: 'IRRIGATION', eventDate: '2026-07-21' };

  it('should reject creation from an auditor (403)', async () => {
    const cycleId = await seedOpenCycle();

    await request(app.getHttpServer())
      .post(`/production-cycles/${cycleId}/events`)
      .set('Authorization', authHeader('auditor'))
      .send(validDto)
      .expect(403);
  });

  it('should allow an operador to register an event on an open cycle', async () => {
    const cycleId = await seedOpenCycle();

    const response = await request(app.getHttpServer())
      .post(`/production-cycles/${cycleId}/events`)
      .set('Authorization', authHeader('operador'))
      .send(validDto)
      .expect(201);

    expect(response.body.eventType).toBe('IRRIGATION');
  });

  it('should reject an event on a closed cycle with 400', async () => {
    const cycleId = await seedClosedCycle();

    await request(app.getHttpServer())
      .post(`/production-cycles/${cycleId}/events`)
      .set('Authorization', authHeader('admin'))
      .send(validDto)
      .expect(400);
  });

  it('should reject updates from an auditor but allow them from an operador', async () => {
    const cycleId = await seedOpenCycle();

    const created = await request(app.getHttpServer())
      .post(`/production-cycles/${cycleId}/events`)
      .set('Authorization', authHeader('admin'))
      .send(validDto)
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/production-cycles/${cycleId}/events/${created.body.id}`)
      .set('Authorization', authHeader('auditor'))
      .send({ description: 'Updated' })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/production-cycles/${cycleId}/events/${created.body.id}`)
      .set('Authorization', authHeader('operador'))
      .send({ description: 'Updated' })
      .expect(200);
  });

  it('should return 404 for a non-existent cycle when listing events', async () => {
    await request(app.getHttpServer())
      .get('/production-cycles/999/events')
      .set('Authorization', authHeader('admin'))
      .expect(404);
  });
});
