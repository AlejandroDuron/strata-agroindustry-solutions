import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { InputsController } from '../src/inputs/inputs.controller';
import { InputsService } from '../src/inputs/inputs.service';
import { Input, InputType } from '../src/inputs/entities/input.entity';
import { ProductionCycle } from '../src/production-cycle/entities/production-cycle.entity';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { jwtConstants } from '../src/auth/constants';
import { createFakeRepository } from './utils/fake-repository';
import { authHeader } from './utils/build-token';

describe('InputsController (e2e)', () => {
  let app: INestApplication;
  let cycleRepo: ReturnType<typeof createFakeRepository<ProductionCycle>>;

  beforeEach(async () => {
    cycleRepo = createFakeRepository<ProductionCycle>([
      { id: 1, status: 'OPEN', field: { area: 5 } } as any,
      { id: 2, status: 'CLOSED', field: { area: 5 } } as any,
    ]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: jwtConstants.secret, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [InputsController],
      providers: [
        InputsService,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        { provide: getRepositoryToken(Input), useValue: createFakeRepository<Input>() },
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

  const validDto = {
    name: 'Urea 46%',
    type: InputType.FERTILIZER,
    quantity: 10,
    unitCost: 15,
    unit: 'kg',
    applicationDate: '2026-07-21',
  };

  it('should reject creation from an auditor (403)', async () => {
    await request(app.getHttpServer())
      .post('/production-cycles/1/inputs')
      .set('Authorization', authHeader('auditor'))
      .send(validDto)
      .expect(403);
  });

  it('should allow an operador to register an input and recalculate the cycle cost', async () => {
    const response = await request(app.getHttpServer())
      .post('/production-cycles/1/inputs')
      .set('Authorization', authHeader('operador'))
      .send(validDto)
      .expect(201);

    expect(response.body.name).toBe('Urea 46%');
    expect(cycleRepo.update).toHaveBeenCalledWith(1, { currentCostPerArea: (10 * 15) / 5 });
  });

  it('should reject an input on a closed cycle with 400', async () => {
    await request(app.getHttpServer())
      .post('/production-cycles/2/inputs')
      .set('Authorization', authHeader('admin'))
      .send(validDto)
      .expect(400);
  });

  it('should allow an operador to update an input but not delete it', async () => {
    const created = await request(app.getHttpServer())
      .post('/production-cycles/1/inputs')
      .set('Authorization', authHeader('admin'))
      .send(validDto)
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/production-cycles/1/inputs/${created.body.id}`)
      .set('Authorization', authHeader('operador'))
      .send({ quantity: 20 })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/production-cycles/1/inputs/${created.body.id}`)
      .set('Authorization', authHeader('operador'))
      .expect(403);
  });
});
