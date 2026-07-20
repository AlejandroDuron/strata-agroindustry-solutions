import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Farm } from './entities/farm.entity';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';

@Injectable()
export class FarmsService {
  constructor(
    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,
  ) {}

  async create(dto: CreateFarmDto): Promise<Farm> {
    await this.throwIfNameTaken(dto.name);
    const farm = this.farmRepository.create(dto);
    return this.farmRepository.save(farm);
  }

  async findAll(): Promise<Farm[]> {
    return this.farmRepository.find({ order: { id: 'ASC' } });
  }

  async findOneOrThrow(id: number): Promise<Farm> {
    const farm = await this.farmRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!farm) {
      throw new NotFoundException(`No se encontró una finca con el id ${id}`);
    }

    return farm;
  }

  async update(id: number, dto: UpdateFarmDto): Promise<Farm> {
    const farm = await this.findNonDeletedOrThrow(id);

    if (dto.name && dto.name !== farm.name) {
      await this.throwIfNameTaken(dto.name);
    }

    Object.assign(farm, dto);
    return this.farmRepository.save(farm);
  }

  async remove(id: number): Promise<Farm> {
    const farm = await this.findNonDeletedOrThrow(id);
    await this.farmRepository.softRemove(farm);
    return farm;
  }

  async findActiveOrThrow(id: number): Promise<Farm> {
    const farm = await this.farmRepository.findOne({ where: { id } });

    if (!farm) {
      throw new NotFoundException(
        `No se encontró una finca activa con el id ${id}`,
      );
    }

    return farm;
  }

  private async findNonDeletedOrThrow(id: number): Promise<Farm> {
    const farm = await this.farmRepository.findOne({ where: { id } });

    if (!farm) {
      throw new NotFoundException(`No se encontró una finca con el id ${id}`);
    }

    return farm;
  }

  private async throwIfNameTaken(name: string): Promise<void> {
    const existing = await this.farmRepository.findOne({
      where: { name },
      withDeleted: true,
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe una finca registrada con el nombre "${name}"`,
      );
    }
  }
}
