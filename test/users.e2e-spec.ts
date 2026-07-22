import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { User } from '../src/users/entities/user.entity';
import { Role } from '../src/auth/entities/role.entity';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { jwtConstants } from '../src/auth/constants';
import { createFakeRepository } from './utils/fake-repository';
import { authHeader } from './utils/build-token';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: jwtConstants.secret, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [UsersController],
      providers: [
        UsersService,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        { provide: getRepositoryToken(User), useValue: createFakeRepository<User>() },
        { provide: getRepositoryToken(Role), useValue: createFakeRepository<Role>() },
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
    await request(app.getHttpServer()).get('/users').expect(401);
  });

  it('should reject non-admin roles', async () => {
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', authHeader('gerente'))
      .expect(403);
  });

  it('should allow admin to create and list users', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', authHeader('admin'))
      .send({ email: 'nuevo@example.com', password: 'password123', role: 'operador' })
      .expect(201);

    expect(createResponse.body.email).toBe('nuevo@example.com');
    expect(createResponse.body.passwordHash).toBeUndefined();

    const listResponse = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', authHeader('admin'))
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
  });

  it('should return 404 when deleting a non-existent user', async () => {
    await request(app.getHttpServer())
      .delete('/users/999')
      .set('Authorization', authHeader('admin'))
      .expect(404);
  });
});
