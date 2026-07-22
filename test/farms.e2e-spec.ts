import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { FarmsController } from '../src/farms/farms.controller';
import { FarmsService } from '../src/farms/farms.service';
import { Farm } from '../src/farms/entities/farm.entity';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { jwtConstants } from '../src/auth/constants';
import { createFakeRepository } from './utils/fake-repository';
import { authHeader } from './utils/build-token';

describe('FarmsController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: jwtConstants.secret, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [FarmsController],
      providers: [
        FarmsService,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        { provide: getRepositoryToken(Farm), useValue: createFakeRepository<Farm>() },
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
      .post('/farms')
      .set('Authorization', authHeader('operador'))
      .send({ name: 'Finca El Roble', location: 'Santa Ana' })
      .expect(403);
  });

  it('should allow a gerente to create a farm and list it', async () => {
    await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', authHeader('gerente'))
      .send({ name: 'Finca El Roble', location: 'Santa Ana' })
      .expect(201);

    const listResponse = await request(app.getHttpServer())
      .get('/farms')
      .set('Authorization', authHeader('auditor'))
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].name).toBe('Finca El Roble');
  });

  it('should reject an invalid payload with 400', async () => {
    await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', authHeader('admin'))
      .send({ name: '' })
      .expect(400);
  });

  it('should return 409 when creating a farm with a duplicate name', async () => {
    await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', authHeader('admin'))
      .send({ name: 'Finca Duplicada', location: 'Sonsonate' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', authHeader('admin'))
      .send({ name: 'Finca Duplicada', location: 'Sonsonate' })
      .expect(409);
  });

  it('should reject deletion from a gerente and allow it from admin', async () => {
    const created = await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', authHeader('admin'))
      .send({ name: 'Finca a Eliminar', location: 'La Libertad' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/farms/${created.body.id}`)
      .set('Authorization', authHeader('gerente'))
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/farms/${created.body.id}`)
      .set('Authorization', authHeader('admin'))
      .expect(200);
  });
});
