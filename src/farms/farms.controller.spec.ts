import { FarmsController } from './farms.controller';
import { FarmsService } from './farms.service';

const mockFarmsService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOneOrThrow: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('FarmsController', () => {
  let controller: FarmsController;
  let service: jest.Mocked<ReturnType<typeof mockFarmsService>>;

  beforeEach(() => {
    service = mockFarmsService() as any;
    controller = new FarmsController(service as any);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a farm', async () => {
    const dto = { name: 'Finca El Roble', location: 'Santa Ana' };
    service.create.mockResolvedValue({ id: 1, ...dto } as any);

    const result = await controller.create(dto as any);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('should list all farms', async () => {
    const farms = [{ id: 1 }, { id: 2 }];
    service.findAll.mockResolvedValue(farms as any);

    const result = await controller.findAll();

    expect(result).toEqual(farms);
  });

  it('should return a farm by id', async () => {
    const farm = { id: 1, name: 'Finca El Roble' };
    service.findOneOrThrow.mockResolvedValue(farm as any);

    const result = await controller.findOne(1);

    expect(service.findOneOrThrow).toHaveBeenCalledWith(1);
    expect(result).toEqual(farm);
  });

  it('should update a farm', async () => {
    const dto = { name: 'New Name' };
    service.update.mockResolvedValue({ id: 1, ...dto } as any);

    const result = await controller.update(1, dto as any);

    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('should remove a farm (soft delete)', async () => {
    const farm = { id: 1, name: 'Finca El Roble' };
    service.remove.mockResolvedValue(farm as any);

    const result = await controller.remove(1);

    expect(service.remove).toHaveBeenCalledWith(1, false);
    expect(result).toEqual(farm);
  });

  it('should remove a farm (hard delete)', async () => {
    const farm = { id: 1, name: 'Finca El Roble' };
    service.remove.mockResolvedValue(farm as any);

    const result = await controller.remove(1, 'true');

    expect(service.remove).toHaveBeenCalledWith(1, true);
    expect(result).toEqual(farm);
  });
});
