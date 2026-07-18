import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const mockAuthService = () => ({
  register: jest.fn(),
  validateUser: jest.fn(),
  login: jest.fn(),
});

describe('AuthController', () => {
  let controller: AuthController;
  let authService: ReturnType<typeof mockAuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useFactory: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService) as any;
  });

  it('should register a new user', async () => {
    const dto: RegisterDto = {
      email: 'new@example.com',
      password: 'password123',
      role: 'user',
    };

    authService.register.mockResolvedValue({ id: '1', email: dto.email, role: dto.role });

    const result = await controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: '1', email: dto.email, role: dto.role });
  });

  it('should login a valid user', async () => {
    const dto: LoginDto = { email: 'login@example.com', password: 'password123' };
    const user = { id: '1', email: dto.email, role: 'user' };

    authService.validateUser.mockResolvedValue(user);
    authService.login.mockResolvedValue({ access_token: 'jwt-token' });

    const result = await controller.login(dto);

    expect(authService.validateUser).toHaveBeenCalledWith(dto.email, dto.password);
    expect(authService.login).toHaveBeenCalledWith(user);
    expect(result).toEqual({ access_token: 'jwt-token' });
  });
});
