import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { CropEventsController } from '../src/crop-events/crop-events.controller';
import { CropEventsService } from '../src/crop-events/crop-events.service';
import { CropEvent, EventType } from '../src/crop-events/entities/crop-event.entity';
import { ProductionCycle } from '../src/production-cycle/entities/production-cycle.entity';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { jwtConstants } from '../src/auth/constants';
import { createFakeRepository } from './utils/fake-repository';
import { authHeader } from './utils/build-token';

describe('CropEventsController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const cycleRepo = createFakeRepository<ProductionCycle>([
      { id: 1, status: 'OPEN' } as any,
      { id: 2, status: 'CLOSED' } as any,
    ]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: jwtConstants.secret, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [CropEventsController],
      providers: [
        CropEventsService,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        { provide: getRepositoryToken(CropEvent), useValue: createFakeRepository<CropEvent>() },
        { provide: getRepositoryToken(ProductionCycle), useValue: cycleRepo },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const validDto = { eventType: EventType.IRRIGATION, eventDate: '2026-07-21' };

  it('should reject creation from an auditor (403)', async () => {
    await request(app.getHttpServer())
      .post('/production-cycles/1/events')
      .set('Authorization', authHeader('auditor'))
      .send(validDto)
      .expect(403);
  });

  it('should allow an operador to register an event on an open cycle', async () => {
    const response = await request(app.getHttpServer())
      .post('/production-cycles/1/events')
      .set('Authorization', authHeader('operador'))
      .send(validDto)
      .expect(201);

    expect(response.body.eventType).toBe(EventType.IRRIGATION);
  });

  it('should reject an event on a closed cycle with 400', async () => {
    await request(app.getHttpServer())
      .post('/production-cycles/2/events')
      .set('Authorization', authHeader('admin'))
      .send(validDto)
      .expect(400);
  });

  it('should reject updates from an auditor but allow them from an operador', async () => {
    const created = await request(app.getHttpServer())
      .post('/production-cycles/1/events')
      .set('Authorization', authHeader('admin'))
      .send(validDto)
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/production-cycles/1/events/${created.body.id}`)
      .set('Authorization', authHeader('auditor'))
      .send({ description: 'Updated' })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/production-cycles/1/events/${created.body.id}`)
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
