import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { ReportsController } from '../src/reports/reports.controller';
import { ReportsService } from '../src/reports/reports.service';
import { ProductionCycle } from '../src/production-cycle/entities/production-cycle.entity';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { jwtConstants } from '../src/auth/constants';
import { createFakeRepository } from './utils/fake-repository';
import { authHeader } from './utils/build-token';

describe('ReportsController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const cycleRepo = createFakeRepository<ProductionCycle>([
      {
        id: 1,
        fieldId: 1,
        status: 'CLOSED',
        field: { id: 1, name: 'Lote 1', area: 5 },
        crop: { variety: 'Arabica' },
        sowingDate: '2025-01-01',
        expectedHarvestDate: '2025-06-01',
        estimatedYield: 25,
        realYieldAtClose: 26,
        totalRevenueAtClose: 1000,
        totalCostAtClose: 400,
        grossMarginAtClose: 600,
        harvests: [],
      } as any,
    ]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: jwtConstants.secret, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [ReportsController],
      providers: [
        ReportsService,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
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
    const response = await request(app.getHttpServer())
      .get('/reports/yield-history?fieldId=1')
      .set('Authorization', authHeader('auditor'))
      .expect(200);

    expect(response.body.fieldId).toBe(1);
    expect(response.body.history).toHaveLength(1);
  });

  it('should return the financial summary', async () => {
    const response = await request(app.getHttpServer())
      .get('/reports/financial')
      .set('Authorization', authHeader('gerente'))
      .expect(200);

    expect(response.body.totalClosedCycles).toBe(1);
    expect(response.body.totalRevenue).toBe(1000);
  });
});
