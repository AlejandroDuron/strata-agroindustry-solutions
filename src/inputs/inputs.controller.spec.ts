import { InputsController } from './inputs.controller';
import { InputsService } from './inputs.service';
import { InputType } from './entities/input.entity';

const mockInputsService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('InputsController', () => {
  let controller: InputsController;
  let service: jest.Mocked<ReturnType<typeof mockInputsService>>;

  beforeEach(() => {
    service = mockInputsService() as any;
    controller = new InputsController(service as any);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an input', async () => {
    const dto = { name: 'Urea', type: InputType.FERTILIZER, quantity: 10, unitCost: 15, unit: 'kg', applicationDate: '2026-07-21' };
    service.create.mockResolvedValue({ id: 1, ...dto } as any);

    const result = await controller.create(1, dto as any);

    expect(service.create).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('should list inputs of a cycle', async () => {
    const inputs = [{ id: 1 }];
    service.findAll.mockResolvedValue(inputs as any);

    const result = await controller.findAll(1);

    expect(service.findAll).toHaveBeenCalledWith(1);
    expect(result).toEqual(inputs);
  });

  it('should return an input by id', async () => {
    const input = { id: 1 };
    service.findOne.mockResolvedValue(input as any);

    const result = await controller.findOne(1, 1);

    expect(service.findOne).toHaveBeenCalledWith(1, 1);
    expect(result).toEqual(input);
  });

  it('should update an input', async () => {
    const dto = { quantity: 20 };
    service.update.mockResolvedValue({ id: 1, ...dto } as any);

    const result = await controller.update(1, 1, dto as any);

    expect(service.update).toHaveBeenCalledWith(1, 1, dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('should remove an input', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove(1, 1);

    expect(service.remove).toHaveBeenCalledWith(1, 1);
  });
});
