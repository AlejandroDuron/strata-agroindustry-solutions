import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { CropsController } from '../src/crops/crops.controller';
import { CropsService } from '../src/crops/crops.service';
import { Crop } from '../src/crops/entities/crop.entity';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { jwtConstants } from '../src/auth/constants';
import { createFakeRepository } from './utils/fake-repository';
import { authHeader } from './utils/build-token';

describe('CropsController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: jwtConstants.secret, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [CropsController],
      providers: [
        CropsService,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        { provide: getRepositoryToken(Crop), useValue: createFakeRepository<Crop>() },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
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
