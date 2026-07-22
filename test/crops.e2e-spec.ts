import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase } from './utils/test-app';
import { authHeader } from './utils/build-token';

describe('CropsController (e2e)', () => {
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

  it('should reject requests without a token', async () => {
    await request(app.getHttpServer()).get('/crops').expect(401);
  });

  it('should reject creation from an operador (403)', async () => {
    await request(app.getHttpServer())
      .post('/crops')
      .set('Authorization', authHeader('operador'))
      .send({ type: 'Coffee', variety: 'Arabica' })
      .expect(403);
  });

  it('should create and then read a crop', async () => {
    const created = await request(app.getHttpServer())
      .post('/crops')
      .set('Authorization', authHeader('gerente'))
      .send({ type: 'Coffee', variety: 'Arabica' })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/crops/${created.body.id}`)
      .set('Authorization', authHeader('auditor'))
      .expect(200);
  });

  it('should return 409 for a duplicate type+variety', async () => {
    await request(app.getHttpServer())
      .post('/crops')
      .set('Authorization', authHeader('admin'))
      .send({ type: 'Maize', variety: 'Yellow' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/crops')
      .set('Authorization', authHeader('admin'))
      .send({ type: 'Maize', variety: 'Yellow' })
      .expect(409);
  });

  it('should return 404 for a crop that does not exist', async () => {
    await request(app.getHttpServer())
      .get('/crops/999')
      .set('Authorization', authHeader('admin'))
      .expect(404);
  });
});
