import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { User } from '../src/users/entities/user.entity';
import { Role } from '../src/auth/entities/role.entity';
import { jwtConstants } from '../src/auth/constants';
import { createFakeRepository } from './utils/fake-repository';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: jwtConstants.secret, signOptions: { expiresIn: '1h' } })],
      controllers: [AuthController],
      providers: [
        AuthService,
        UsersService,
        { provide: getRepositoryToken(User), useValue: createFakeRepository<User>() },
        { provide: getRepositoryToken(Role), useValue: createFakeRepository<Role>() },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/auth/register and /auth/login flow', async () => {
    const registerDto = {
      email: 'postman@example.com',
      password: 'securePassword',
      role: 'user',
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          email: registerDto.email,
        });
        expect(response.body.passwordHash).toBeUndefined();
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: registerDto.email, password: registerDto.password })
      .expect(200);

    expect(loginResponse.body.access_token).toBeDefined();
  });

  it('should reject login with an invalid password', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'wrongpass@example.com', password: 'securePassword' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'wrongpass@example.com', password: 'incorrectPassword' })
      .expect(401);
  });

  it('should reject registration with an invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'not-an-email', password: '123' })
      .expect(400);
  });
});
