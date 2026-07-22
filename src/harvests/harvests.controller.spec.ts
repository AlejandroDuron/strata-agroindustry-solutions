import { HarvestsController } from './harvests.controller';
import { HarvestsService } from './harvests.service';

const mockHarvestsService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findAllByCycle: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('HarvestsController', () => {
  let controller: HarvestsController;
  let service: jest.Mocked<ReturnType<typeof mockHarvestsService>>;

  beforeEach(() => {
    service = mockHarvestsService() as any;
    controller = new HarvestsController(service as any);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a harvest', async () => {
    const dto = { cycleId: 1, quantityObtained: 25.5, quality: 'A', unitSalePrice: 120, quantitySold: 22 };
    service.create.mockResolvedValue({ id: 1, ...dto } as any);

    const result = await controller.create(dto as any);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('should list all harvests when no cycleId filter is given', async () => {
    const harvests = [{ id: 1 }];
    service.findAll.mockResolvedValue(harvests as any);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalled();
    expect(service.findAllByCycle).not.toHaveBeenCalled();
    expect(result).toEqual(harvests);
  });

  it('should list harvests filtered by cycleId', async () => {
    const harvests = [{ id: 1 }];
    service.findAllByCycle.mockResolvedValue(harvests as any);

    const result = await controller.findAll('5');

    expect(service.findAllByCycle).toHaveBeenCalledWith(5);
    expect(result).toEqual(harvests);
  });

  it('should return a harvest by id', async () => {
    const harvest = { id: 1 };
    service.findOne.mockResolvedValue(harvest as any);

    const result = await controller.findOne(1);

    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result).toEqual(harvest);
  });

  it('should update a harvest', async () => {
    const dto = { quantityObtained: 30 };
    service.update.mockResolvedValue({ id: 1, ...dto } as any);

    const result = await controller.update(1, dto as any);

    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('should remove a harvest', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove(1);

    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
