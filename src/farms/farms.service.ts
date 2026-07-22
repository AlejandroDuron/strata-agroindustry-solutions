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
  ) { }

  async create(dto: CreateFarmDto): Promise<Farm> {
    // Check if an active farm with the same name exists
    const activeDuplicate = await this.farmRepository.findOne({
      where: { name: dto.name },
    });
    if (activeDuplicate) {
      throw new ConflictException(
        `A farm with the name "${dto.name}" already exists`,
      );
    }

    // Check if a soft-deleted farm with the same name exists — restore it
    const deletedDuplicate = await this.farmRepository.findOne({
      where: { name: dto.name },
      withDeleted: true,
    });
    if (deletedDuplicate) {
      deletedDuplicate.deletedAt = null;
      deletedDuplicate.location = dto.location;
      return this.farmRepository.save(deletedDuplicate);
    }

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
      throw new NotFoundException(`Farm with id ${id} not found`);
    }

    return farm;
  }

  async update(id: number, dto: UpdateFarmDto): Promise<Farm> {
    const farm = await this.findNonDeletedOrThrow(id);

    if (dto.name && dto.name !== farm.name) {
      await this.throwIfNameTaken(dto.name, id);
    }

    Object.assign(farm, dto);
    return this.farmRepository.save(farm);
  }

  async remove(id: number, hard = false): Promise<Farm> {
    const farm = await this.findNonDeletedOrThrow(id);
    if (hard) {
      await this.farmRepository.remove(farm);
    } else {
      await this.farmRepository.softRemove(farm);
    }
    return farm;
  }

  async findActiveOrThrow(id: number): Promise<Farm> {
    const farm = await this.farmRepository.findOne({ where: { id } });

    if (!farm) {
      throw new NotFoundException(
        `Active farm with id ${id} not found`,
      );
    }

    return farm;
  }

  private async findNonDeletedOrThrow(id: number): Promise<Farm> {
    const farm = await this.farmRepository.findOne({ where: { id } });

    if (!farm) {
      throw new NotFoundException(`Farm with id ${id} not found`);
    }

    return farm;
  }

  private async throwIfNameTaken(name: string, excludeId?: number): Promise<void> {
    const query = this.farmRepository
      .createQueryBuilder('farm')
      .where('farm.name = :name', { name })
      .andWhere('farm.deletedAt IS NULL');

    if (excludeId) {
      query.andWhere('farm.id != :excludeId', { excludeId });
    }

    const existing = await query.getOne();

    if (existing) {
      throw new ConflictException(
        `A farm with the name "${name}" already exists`,
      );
    }
  }
}
