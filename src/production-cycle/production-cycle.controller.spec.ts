import { ProductionCycleController } from './production-cycle.controller';
import { ProductionCycleService } from './production-cycle.service';

const mockProductionCycleService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  close: jest.fn(),
  remove: jest.fn(),
});

describe('ProductionCycleController', () => {
  let controller: ProductionCycleController;
  let service: jest.Mocked<ReturnType<typeof mockProductionCycleService>>;

  beforeEach(() => {
    service = mockProductionCycleService() as any;
    controller = new ProductionCycleController(service as any);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a production cycle', async () => {
    const dto = { fieldId: 1, cropId: 1, sowingDate: '2026-01-15', expectedHarvestDate: '2026-06-15', estimatedYield: 30 };
    service.create.mockResolvedValue({ id: 1, ...dto } as any);

    const result = await controller.create(dto as any);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('should list all production cycles', async () => {
    const cycles = [{ id: 1 }];
    service.findAll.mockResolvedValue(cycles as any);

    const result = await controller.findAll();

    expect(result).toEqual(cycles);
  });

  it('should return a production cycle by id', async () => {
    const cycle = { id: 1 };
    service.findOne.mockResolvedValue(cycle as any);

    const result = await controller.findOne(1);

    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result).toEqual(cycle);
  });

  it('should update a production cycle', async () => {
    const dto = { estimatedYield: 40 };
    service.update.mockResolvedValue({ id: 1, ...dto } as any);

    const result = await controller.update(1, dto as any);

    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('should close a production cycle', async () => {
    const closeResult = { cycle: { id: 1, status: 'CLOSED' }, yieldAlert: false, alertMessage: null, realYield: 30, estimatedYield: 30, historicalAvgYield: null };
    service.close.mockResolvedValue(closeResult as any);

    const result = await controller.close(1);

    expect(service.close).toHaveBeenCalledWith(1);
    expect(result).toEqual(closeResult);
  });

  it('should remove a production cycle', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove(1);

    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
