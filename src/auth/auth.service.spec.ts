import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

const mockUsersService = () => ({
  findByEmail: jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<ReturnType<typeof mockUsersService>>;
  let jwtService: JwtService;

  beforeEach(() => {
    usersService = mockUsersService() as any;
    jwtService = new JwtService({ secret: 'testSecret' });
    service = new AuthService(usersService as any, jwtService);
  });

  it('should validate a user with correct credentials', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      passwordHash: await require('bcryptjs').hash('password123', 10),
      role: { name: 'user' },
    });

    const result = await service.validateUser('test@example.com', 'password123');

    expect(result).toEqual({
      id: 1,
      email: 'test@example.com',
      role: { name: 'user' },
    });
  });

  it('should return null when email does not exist', async () => {
    usersService.findByEmail.mockResolvedValue(undefined);

    const result = await service.validateUser('missing@example.com', 'password123');

    expect(result).toBeNull();
  });

  it('should return null when password is incorrect', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      passwordHash: await require('bcryptjs').hash('password123', 10),
      role: { name: 'user' },
    });

    const result = await service.validateUser('test@example.com', 'wrongPassword');

    expect(result).toBeNull();
  });

  it('should generate a JWT access token on login', async () => {
    const token = await service.login({ id: 1, email: 'token@example.com', role: { name: 'user' } });

    expect(token.access_token).toBeDefined();
    expect(typeof token.access_token).toBe('string');
  });
});
