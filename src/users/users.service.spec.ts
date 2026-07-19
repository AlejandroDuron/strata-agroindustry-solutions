import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: any;
  let roleRepository: any;

  beforeEach(() => {
    userRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };
    roleRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    service = new UsersService(userRepository, roleRepository);
  });

  it('should create a user without returning the password', async () => {
    const dto: CreateUserDto = {
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    };

    roleRepository.findOne.mockResolvedValue(null);
    roleRepository.create.mockReturnValue({ id: 1, name: 'admin' });
    roleRepository.save.mockResolvedValue({ id: 1, name: 'admin' });
    userRepository.create.mockReturnValue({ id: 1, email: dto.email, role: { id: 1, name: 'admin' } });
    userRepository.save.mockResolvedValue({ id: 1, email: dto.email, role: { id: 1, name: 'admin' }, passwordHash: 'hashed' });

    const result = await service.create(dto);

    expect(result).toMatchObject({
      id: 1,
      email: dto.email,
      role: { id: 1, name: 'admin' },
    });
  });

  it('should throw NotFoundException when user does not exist', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
  });
});
