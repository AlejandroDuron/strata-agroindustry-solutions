import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService();
  });

  it('should create a user without returning the password', async () => {
    const dto: CreateUserDto = {
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    };

    const result = await service.create(dto);

    expect(result).toMatchObject({
      id: '1',
      email: dto.email,
      role: dto.role,
    });
    expect((result as any).password).toBeUndefined();
  });

  it('should return all users without passwords', async () => {
    await service.create({
      email: 'user@example.com',
      password: 'password123',
    });

    const users = await service.findAll();

    expect(users).toHaveLength(1);
    expect(users[0]).toEqual(expect.objectContaining({ email: 'user@example.com' }));
    expect((users[0] as any).password).toBeUndefined();
  });

  it('should find one user by id', async () => {
    await service.create({
      email: 'find@example.com',
      password: 'password123',
    });

    const user = await service.findOne('1');

    expect(user.email).toBe('find@example.com');
    expect((user as any).password).toBeUndefined();
  });

  it('should throw NotFoundException when user does not exist', async () => {
    await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
  });

  it('should update a user and hash a new password', async () => {
    await service.create({
      email: 'update@example.com',
      password: 'password123',
    });

    const dto: UpdateUserDto = {
      email: 'updated@example.com',
      password: 'newPassword123',
      role: 'admin',
    };

    const updated = await service.update('1', dto);

    expect(updated.email).toBe(dto.email);
    expect(updated.role).toBe(dto.role);
    expect((updated as any).password).toBeUndefined();
  });

  it('should remove a user by id', async () => {
    await service.create({
      email: 'delete@example.com',
      password: 'password123',
    });

    await service.remove('1');

    await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
  });
});
