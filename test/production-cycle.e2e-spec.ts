import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { ProductionCycleController } from '../src/production-cycle/production-cycle.controller';
import { ProductionCycleService } from '../src/production-cycle/production-cycle.service';
import { ProductionCycle } from '../src/production-cycle/entities/production-cycle.entity';
import { Harvest } from '../src/harvests/entities/harvest.entity';
import { Input } from '../src/inputs/entities/input.entity';
import { Field } from '../src/fields/entities/field.entity';
import { Crop } from '../src/crops/entities/crop.entity';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { jwtConstants } from '../src/auth/constants';
import { createFakeRepository } from './utils/fake-repository';
import { authHeader } from './utils/build-token';

describe('ProductionCycleController (e2e)', () => {
  let app: INestApplication;
  let cycleRepo: ReturnType<typeof createFakeRepository<ProductionCycle>>;

  beforeEach(async () => {
    cycleRepo = createFakeRepository<ProductionCycle>();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: jwtConstants.secret, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [ProductionCycleController],
      providers: [
        ProductionCycleService,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        { provide: getRepositoryToken(ProductionCycle), useValue: cycleRepo },
        { provide: getRepositoryToken(Harvest), useValue: createFakeRepository<Harvest>() },
        { provide: getRepositoryToken(Input), useValue: createFakeRepository<Input>() },
        { provide: getRepositoryToken(Field), useValue: createFakeRepository<Field>([{ id: 1 } as any]) },
        { provide: getRepositoryToken(Crop), useValue: createFakeRepository<Crop>([{ id: 1 } as any]) },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const validDto = {
    fieldId: 1,
    cropId: 1,
    sowingDate: '2026-01-15',
    expectedHarvestDate: '2026-06-15',
    estimatedYield: 30,
  };

  it('should reject creation from an operador (403)', async () => {
    await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', authHeader('operador'))
      .send(validDto)
      .expect(403);
  });

  it('should create a cycle and reject a second open cycle for the same field', async () => {
    await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', authHeader('gerente'))
      .send(validDto)
      .expect(201);

    await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', authHeader('gerente'))
      .send(validDto)
      .expect(400);
  });

  it('should reject closing a cycle without harvests', async () => {
    const created = await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', authHeader('admin'))
      .send(validDto)
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/production-cycle/${created.body.id}/close`)
      .set('Authorization', authHeader('admin'))
      .expect(400);
  });

  it('should close a cycle and compute the financial summary', async () => {
    const created = await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', authHeader('admin'))
      .send(validDto)
      .expect(201);

    const row = cycleRepo.rows().find((r) => r.id === created.body.id)!;
    row.field = { id: 1, name: 'Lote 1' };
    row.crop = { id: 1 };
    row.harvests = [{ quantityObtained: 20, quantitySold: 18, unitSalePrice: 100 }];
    row.inputs = [{ quantity: 5, unitCost: 20 }];

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
    const created = await request(app.getHttpServer())
      .post('/production-cycle')
      .set('Authorization', authHeader('admin'))
      .send(validDto)
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
