import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { HarvestsController } from '../src/harvests/harvests.controller';
import { HarvestsService } from '../src/harvests/harvests.service';
import { Harvest } from '../src/harvests/entities/harvest.entity';
import { ProductionCycle } from '../src/production-cycle/entities/production-cycle.entity';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { jwtConstants } from '../src/auth/constants';
import { createFakeRepository } from './utils/fake-repository';
import { authHeader } from './utils/build-token';

describe('HarvestsController (e2e)', () => {
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
      controllers: [HarvestsController],
      providers: [
        HarvestsService,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        {
          provide: getRepositoryToken(Harvest),
          useValue: createFakeRepository<Harvest>([], (row) => ({
            ...row,
            productionCycle: cycleRepo.rows().find((c) => c.id === row.productionCycleId),
          })),
        },
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

  const validDto = { cycleId: 1, quantityObtained: 25.5, quality: 'A', unitSalePrice: 120, quantitySold: 22 };

  it('should reject creation from an auditor (403)', async () => {
    await request(app.getHttpServer())
      .post('/harvests')
      .set('Authorization', authHeader('auditor'))
      .send(validDto)
      .expect(403);
  });

  it('should allow an operador to register a harvest on an open cycle', async () => {
    const response = await request(app.getHttpServer())
      .post('/harvests')
      .set('Authorization', authHeader('operador'))
      .send(validDto)
      .expect(201);

    expect(response.body.quantityObtained).toBe(25.5);
  });

  it('should reject a harvest on a closed cycle with 400', async () => {
    await request(app.getHttpServer())
      .post('/harvests')
      .set('Authorization', authHeader('admin'))
      .send({ ...validDto, cycleId: 2 })
      .expect(400);
  });

  it('should allow an operador to update a harvest', async () => {
    const created = await request(app.getHttpServer())
      .post('/harvests')
      .set('Authorization', authHeader('admin'))
      .send(validDto)
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/harvests/${created.body.id}`)
      .set('Authorization', authHeader('operador'))
      .send({ quantityObtained: 30 })
      .expect(200);
  });

  it('should reject deletion from an operador and allow it from admin', async () => {
    const created = await request(app.getHttpServer())
      .post('/harvests')
      .set('Authorization', authHeader('admin'))
      .send(validDto)
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
