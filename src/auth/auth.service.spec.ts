import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
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
      role: { name: 'operador' },
    });

    const result = await service.validateUser('test@example.com', 'password123');

    expect(result).toEqual({
      id: 1,
      email: 'test@example.com',
      role: { name: 'operador' },
    });
  });

  it('should throw UnauthorizedException when email does not exist', async () => {
    usersService.findByEmail.mockResolvedValue(undefined);

    await expect(
      service.validateUser('missing@example.com', 'password123'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when password is incorrect', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      passwordHash: await require('bcryptjs').hash('password123', 10),
      role: { name: 'operador' },
    });

    await expect(
      service.validateUser('test@example.com', 'wrongPassword'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should generate a JWT access token on login', async () => {
    const token = await service.login({ id: 1, email: 'token@example.com', role: { name: 'operador' } });

    expect(token.access_token).toBeDefined();
    expect(typeof token.access_token).toBe('string');
  });
});
