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
      softRemove: jest.fn(),
    };
    roleRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    service = new UsersService(userRepository, roleRepository);
  });

  describe('create', () => {
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
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('should reuse an existing role instead of creating a new one', async () => {
      const dto: CreateUserDto = { email: 'user@example.com', password: 'password123', role: 'gerente' };
      roleRepository.findOne.mockResolvedValue({ id: 2, name: 'gerente' });
      userRepository.create.mockReturnValue({ id: 2, email: dto.email, role: { id: 2, name: 'gerente' } });
      userRepository.save.mockResolvedValue({ id: 2, email: dto.email, role: { id: 2, name: 'gerente' }, passwordHash: 'hashed' });

      await service.create(dto);

      expect(roleRepository.create).not.toHaveBeenCalled();
    });

    it('should default to the "user" role when none is provided', async () => {
      const dto: CreateUserDto = { email: 'noRole@example.com', password: 'password123' };
      roleRepository.findOne.mockResolvedValue({ id: 3, name: 'user' });
      userRepository.create.mockReturnValue({ id: 3, email: dto.email });
      userRepository.save.mockResolvedValue({ id: 3, email: dto.email, passwordHash: 'hashed' });

      await service.create(dto);

      expect(roleRepository.findOne).toHaveBeenCalledWith({ where: { name: 'user' } });
    });
  });

  describe('findAll', () => {
    it('should return users without their password hash', async () => {
      userRepository.find.mockResolvedValue([
        { id: 1, email: 'a@example.com', passwordHash: 'x' },
        { id: 2, email: 'b@example.com', passwordHash: 'y' },
      ]);

      const result = await service.findAll();

      expect(result).toEqual([
        { id: 1, email: 'a@example.com' },
        { id: 2, email: 'b@example.com' },
      ]);
    });
  });

  describe('findOne', () => {
    it('should return a user by id without the password hash', async () => {
      userRepository.findOne.mockResolvedValue({ id: 1, email: 'a@example.com', passwordHash: 'x' });

      const result = await service.findOne('1');

      expect(result).toEqual({ id: 1, email: 'a@example.com' });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return the user including the password hash', async () => {
      const user = { id: 1, email: 'a@example.com', passwordHash: 'x' };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('a@example.com');

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'a@example.com' } });
      expect(result).toEqual(user);
    });

    it('should return null when no user matches the email', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('missing@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update email, password, and role', async () => {
      const existingUser = { id: 1, email: 'old@example.com', passwordHash: 'old', role: { id: 1, name: 'user' } };
      userRepository.findOne.mockResolvedValue(existingUser);
      roleRepository.findOne.mockResolvedValue({ id: 2, name: 'admin' });
      userRepository.save.mockImplementation(async (u: any) => u);

      const dto: UpdateUserDto = { email: 'new@example.com', password: 'newPassword123', role: 'admin' };
      const result = await service.update('1', dto);

      expect(result.email).toBe('new@example.com');
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('should throw NotFoundException when the user to update does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.update('999', {} as UpdateUserDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an existing user', async () => {
      const user = { id: 1, email: 'a@example.com' };
      userRepository.findOne.mockResolvedValue(user);

      await service.remove('1');

      expect(userRepository.softRemove).toHaveBeenCalledWith(user);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});
