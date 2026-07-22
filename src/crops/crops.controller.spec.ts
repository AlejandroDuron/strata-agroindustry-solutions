import { CropsController } from './crops.controller';
import { CropsService } from './crops.service';

const mockCropsService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('CropsController', () => {
  let controller: CropsController;
  let service: jest.Mocked<ReturnType<typeof mockCropsService>>;

  beforeEach(() => {
    service = mockCropsService() as any;
    controller = new CropsController(service as any);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a crop', async () => {
    const dto = { type: 'Coffee', variety: 'Arabica' };
    service.create.mockResolvedValue({ id: 1, ...dto } as any);

    const result = await controller.create(dto as any);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('should list all crops', async () => {
    const crops = [{ id: 1 }, { id: 2 }];
    service.findAll.mockResolvedValue(crops as any);

    const result = await controller.findAll();

    expect(result).toEqual(crops);
  });

  it('should return a crop by id', async () => {
    const crop = { id: 1, type: 'Coffee', variety: 'Arabica' };
    service.findOne.mockResolvedValue(crop as any);

    const result = await controller.findOne(1);

    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result).toEqual(crop);
  });

  it('should update a crop', async () => {
    const dto = { variety: 'Bourbon' };
    service.update.mockResolvedValue({ id: 1, ...dto } as any);

    const result = await controller.update(1, dto as any);

    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('should remove a crop', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove(1);

    expect(service.remove).toHaveBeenCalledWith(1, false);
  });
});
