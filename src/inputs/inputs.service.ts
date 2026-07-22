import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Input } from './entities/input.entity';
import { ProductionCycle } from '../production-cycle/entities/production-cycle.entity';
import { CreateInputDto } from './dto/create-input.dto';
import { UpdateInputDto } from './dto/update-input.dto';

@Injectable()
export class InputsService {
  constructor(
    @InjectRepository(Input)
    private readonly inputRepo: Repository<Input>,
    @InjectRepository(ProductionCycle)
    private readonly cycleRepo: Repository<ProductionCycle>,
  ) {}

  private async getCycleAndValidateOpen(cycleId: number): Promise<ProductionCycle> {
    const cycle = await this.cycleRepo.findOne({
      where: { id: cycleId },
      relations: { field: true },
    });

    if (!cycle) {
      throw new NotFoundException(`Production cycle with ID ${cycleId} not found`);
    }

    if (cycle.status === 'CLOSED') {
      throw new BadRequestException(`Cannot perform operation: Production cycle with ID ${cycleId} is CLOSED`);
    }

    return cycle;
  }

  private async recalculateCycleCost(cycleId: number, fieldArea: number): Promise<void> {
    const inputs = await this.inputRepo.find({
      where: { productionCycleId: cycleId },
    });

    const totalCost = inputs.reduce((sum, input) => sum + (input.quantity * input.unitCost), 0);
    const currentCostPerArea = fieldArea > 0 ? totalCost / fieldArea : 0;

    await this.cycleRepo.update(cycleId, { currentCostPerArea });
  }

  private normalizeDate(date: string): string {
    return date.split('T')[0];
  }

  async create(cycleId: number, dto: CreateInputDto): Promise<Input> {
    const cycle = await this.getCycleAndValidateOpen(cycleId);

    if (this.normalizeDate(dto.applicationDate) < this.normalizeDate(cycle.sowingDate)) {
      throw new BadRequestException(
        `applicationDate cannot be before the cycle sowingDate (${cycle.sowingDate})`
      );
    }

    const input = this.inputRepo.create({
      ...dto,
      productionCycleId: cycleId,
      inputType: dto.type, // Backwards compatibility with mock database seeds
    });

    const savedInput = await this.inputRepo.save(input);

    await this.recalculateCycleCost(cycleId, cycle.field?.area ?? 0);

    return savedInput;
  }

  async findAll(cycleId: number): Promise<Input[]> {
    const cycle = await this.cycleRepo.findOne({ where: { id: cycleId } });
    if (!cycle) {
      throw new NotFoundException(`Production cycle with ID ${cycleId} not found`);
    }

    return this.inputRepo.find({
      where: { productionCycleId: cycleId },
      order: { id: 'ASC' },
    });
  }

  async findOne(cycleId: number, id: number): Promise<Input> {
    const input = await this.inputRepo.findOne({
      where: { id, productionCycleId: cycleId },
    });

    if (!input) {
      throw new NotFoundException(`Input with ID ${id} not found in production cycle ${cycleId}`);
    }

    return input;
  }

  async update(cycleId: number, id: number, dto: UpdateInputDto): Promise<Input> {
    const cycle = await this.getCycleAndValidateOpen(cycleId);
    const input = await this.findOne(cycleId, id);

    const checkDate = dto.applicationDate || input.applicationDate;
    if (this.normalizeDate(checkDate) < this.normalizeDate(cycle.sowingDate)) {
      throw new BadRequestException(
        `applicationDate cannot be before the cycle sowingDate (${cycle.sowingDate})`
      );
    }

    Object.assign(input, dto);
    if (dto.type) {
      input.inputType = dto.type;
    }

    const updatedInput = await this.inputRepo.save(input);

    await this.recalculateCycleCost(cycleId, cycle.field?.area ?? 0);

    return updatedInput;
  }

  async remove(cycleId: number, id: number): Promise<void> {
    const cycle = await this.getCycleAndValidateOpen(cycleId);
    const input = await this.findOne(cycleId, id);

    await this.inputRepo.remove(input);

    await this.recalculateCycleCost(cycleId, cycle.field?.area ?? 0);
  }
}
