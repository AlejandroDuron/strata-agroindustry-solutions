import { FieldsController } from './fields.controller';
import { FieldsService } from './fields.service';

const mockFieldsService = () => ({
  create: jest.fn(),
  findAllByFarm: jest.fn(),
  findOneOrThrow: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('FieldsController', () => {
  let controller: FieldsController;
  let service: jest.Mocked<ReturnType<typeof mockFieldsService>>;

  beforeEach(() => {
    service = mockFieldsService() as any;
    controller = new FieldsController(service as any);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a field', async () => {
    const dto = { farmId: 1, name: 'Lote 1', area: 5.5 };
    service.create.mockResolvedValue({ id: 1, ...dto } as any);

    const result = await controller.create(dto as any);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('should list fields of a farm', async () => {
    const fields = [{ id: 1 }, { id: 2 }];
    service.findAllByFarm.mockResolvedValue(fields as any);

    const result = await controller.findAll(1);

    expect(service.findAllByFarm).toHaveBeenCalledWith(1);
    expect(result).toEqual(fields);
  });

  it('should return a field by id', async () => {
    const field = { id: 1, name: 'Lote 1' };
    service.findOneOrThrow.mockResolvedValue(field as any);

    const result = await controller.findOne(1);

    expect(result).toEqual(field);
  });

  it('should update a field', async () => {
    const dto = { name: 'Lote Norte' };
    service.update.mockResolvedValue({ id: 1, ...dto } as any);

    const result = await controller.update(1, dto as any);

    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('should remove a field (soft delete)', async () => {
    const field = { id: 1, name: 'Lote 1' };
    service.remove.mockResolvedValue(field as any);

    const result = await controller.remove(1);

    expect(service.remove).toHaveBeenCalledWith(1, false);
    expect(result).toEqual(field);
  });

  it('should remove a field (hard delete)', async () => {
    const field = { id: 1, name: 'Lote 1' };
    service.remove.mockResolvedValue(field as any);

    const result = await controller.remove(1, 'true');

    expect(service.remove).toHaveBeenCalledWith(1, true);
    expect(result).toEqual(field);
  });
});
