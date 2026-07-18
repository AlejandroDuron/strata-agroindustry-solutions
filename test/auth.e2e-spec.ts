import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
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
          role: registerDto.role,
        });
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: registerDto.email, password: registerDto.password })
      .expect(200);

    expect(loginResponse.body.access_token).toBeDefined();
  });

  afterEach(async () => {
    await app.close();
  });
});
