import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUsersService = () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<ReturnType<typeof mockUsersService>>;

  beforeEach(() => {
    service = mockUsersService() as any;
    controller = new UsersController(service as any);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list all users', async () => {
    const users = [{ id: 1, email: 'a@example.com' }];
    service.findAll.mockResolvedValue(users as any);

    const result = await controller.findAll();

    expect(result).toEqual(users);
  });

  it('should return a user by id', async () => {
    const user = { id: 1, email: 'a@example.com' };
    service.findOne.mockResolvedValue(user as any);

    const result = await controller.findOne('1');

    expect(service.findOne).toHaveBeenCalledWith('1');
    expect(result).toEqual(user);
  });

  it('should create a user', async () => {
    const dto = { email: 'new@example.com', password: 'password123', role: 'admin' };
    service.create.mockResolvedValue({ id: 1, email: dto.email } as any);

    const result = await controller.create(dto as any);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1, email: dto.email });
  });

  it('should update a user', async () => {
    const dto = { email: 'updated@example.com' };
    service.update.mockResolvedValue({ id: 1, ...dto } as any);

    const result = await controller.update('1', dto as any);

    expect(service.update).toHaveBeenCalledWith('1', dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('should remove a user (soft delete)', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove('1');

    expect(service.remove).toHaveBeenCalledWith('1', false);
  });

  it('should remove a user (hard delete)', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove('1', 'true');

    expect(service.remove).toHaveBeenCalledWith('1', true);
  });
});
