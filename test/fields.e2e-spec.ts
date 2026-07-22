import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { FieldsController } from '../src/fields/fields.controller';
import { FieldsService } from '../src/fields/fields.service';
import { FarmsService } from '../src/farms/farms.service';
import { Field } from '../src/fields/entities/field.entity';
import { Farm } from '../src/farms/entities/farm.entity';
import { ProductionCycle } from '../src/production-cycle/entities/production-cycle.entity';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { jwtConstants } from '../src/auth/constants';
import { createFakeRepository } from './utils/fake-repository';
import { authHeader } from './utils/build-token';

describe('FieldsController (e2e)', () => {
  let app: INestApplication;
  let cycleRepo: ReturnType<typeof createFakeRepository<ProductionCycle>>;

  beforeEach(async () => {
    cycleRepo = createFakeRepository<ProductionCycle>();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: jwtConstants.secret, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [FieldsController],
      providers: [
        FieldsService,
        FarmsService,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        { provide: getRepositoryToken(Field), useValue: createFakeRepository<Field>() },
        {
          provide: getRepositoryToken(Farm),
          useValue: createFakeRepository<Farm>([{ id: 1, name: 'Finca Test', location: 'Loc' } as any]),
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

  it('should reject creation from an operador (403)', async () => {
    await request(app.getHttpServer())
      .post('/fields')
      .set('Authorization', authHeader('operador'))
      .send({ farmId: 1, name: 'Lote 1', area: 5.5 })
      .expect(403);
  });

  it('should create a field for an existing farm', async () => {
    const response = await request(app.getHttpServer())
      .post('/fields')
      .set('Authorization', authHeader('gerente'))
      .send({ farmId: 1, name: 'Lote 1', area: 5.5 })
      .expect(201);

    expect(response.body.name).toBe('Lote 1');
  });

  it('should return 404 when the farm does not exist', async () => {
    await request(app.getHttpServer())
      .post('/fields')
      .set('Authorization', authHeader('admin'))
      .send({ farmId: 999, name: 'Lote X', area: 2 })
      .expect(404);
  });

  it('should reject an area change with 409 while an open cycle exists', async () => {
    const created = await request(app.getHttpServer())
      .post('/fields')
      .set('Authorization', authHeader('admin'))
      .send({ farmId: 1, name: 'Lote Con Ciclo', area: 5 })
      .expect(201);

    await cycleRepo.save({ fieldId: created.body.id, status: 'OPEN' } as any);

    await request(app.getHttpServer())
      .patch(`/fields/${created.body.id}`)
      .set('Authorization', authHeader('admin'))
      .send({ area: 10 })
      .expect(409);
  });

  it('should allow gerente to delete a field', async () => {
    const created = await request(app.getHttpServer())
      .post('/fields')
      .set('Authorization', authHeader('admin'))
      .send({ farmId: 1, name: 'Lote a Eliminar', area: 3 })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/fields/${created.body.id}`)
      .set('Authorization', authHeader('gerente'))
      .expect(200);
  });
});
