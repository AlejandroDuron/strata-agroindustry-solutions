import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Field } from './entities/field.entity';
import { ProductionCycle } from '../production-cycle/entities/production-cycle.entity';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { FarmsService } from '../farms/farms.service';

@Injectable()
export class FieldsService {
  constructor(
    @InjectRepository(Field)
    private readonly fieldRepository: Repository<Field>,

    @InjectRepository(ProductionCycle)
    private readonly cycleRepository: Repository<ProductionCycle>,

    private readonly farmsService: FarmsService,
  ) { }

  async create(dto: CreateFieldDto): Promise<Field> {
    await this.farmsService.findActiveOrThrow(dto.farmId);
    await this.throwIfNameTaken(dto.name);

    const field = this.fieldRepository.create(dto);
    return this.fieldRepository.save(field);
  }

  async findAllByFarm(farmId: number): Promise<Field[]> {
    return this.fieldRepository.find({
      where: { farmId },
      order: { id: 'ASC' },
    });
  }

  async findOneOrThrow(id: number): Promise<Field> {
    const field = await this.fieldRepository.findOne({
      where: { id },
      withDeleted: true,
      relations: { farm: true },
    });

    if (!field) {
      throw new NotFoundException(`Field with id ${id} not found`);
    }

    return field;
  }

  async update(id: number, dto: UpdateFieldDto): Promise<Field> {
    const field = await this.findNonDeletedOrThrow(id);

    if (dto.name && dto.name !== field.name) {
      await this.throwIfNameTaken(dto.name);
    }

    if (dto.area !== undefined && dto.area !== field.area) {
      await this.throwIfHasOpenCycles(id);
    }

    Object.assign(field, dto);
    return this.fieldRepository.save(field);
  }

  async remove(id: number, hard = false): Promise<Field> {
    const field = await this.findNonDeletedOrThrow(id);
    if (hard) {
      await this.fieldRepository.remove(field);
    } else {
      await this.fieldRepository.softRemove(field);
    }
    return field;
  }

  private async findNonDeletedOrThrow(id: number): Promise<Field> {
    const field = await this.fieldRepository.findOne({ where: { id } });

    if (!field) {
      throw new NotFoundException(`Field with id ${id} not found`);
    }

    return field;
  }

  private async throwIfHasOpenCycles(fieldId: number): Promise<void> {
    const openCycleCount = await this.cycleRepository.count({
      where: { fieldId: fieldId, status: 'OPEN' },
    });

    if (openCycleCount > 0) {
      throw new ConflictException(
        'Cannot modify the area while open production cycles exist. ' +
        'The cost per area depends on this value.',
      );
    }
  }

  private async throwIfNameTaken(name: string): Promise<void> {
    const existing = await this.fieldRepository.findOne({
      where: { name },
      withDeleted: true,
    });

    if (existing) {
      throw new ConflictException(
        `A field with the name "${name}" already exists`,
      );
    }
  }
}