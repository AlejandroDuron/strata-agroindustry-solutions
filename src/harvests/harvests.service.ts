import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Harvest } from './entities/harvest.entity';
import { ProductionCycle } from '../production-cycle/entities/production-cycle.entity';
import { CreateHarvestDto } from './dto/create-harvest.dto';
import { UpdateHarvestDto } from './dto/update-harvest.dto';

@Injectable()
export class HarvestsService {
  constructor(
    @InjectRepository(Harvest)
    private readonly harvestRepo: Repository<Harvest>,
    @InjectRepository(ProductionCycle)
    private readonly cycleRepo: Repository<ProductionCycle>,
  ) {}

  private async getCycleAndValidateOpen(cycleId: number): Promise<ProductionCycle> {
    const cycle = await this.cycleRepo.findOneBy({ id: cycleId });

    if (!cycle) {
      throw new NotFoundException(
        `Production cycle with id ${cycleId} not found`,
      );
    }

    if (cycle.status === 'CLOSED') {
      throw new BadRequestException(
        'Cannot add a harvest to a closed production cycle',
      );
    }

    return cycle;
  }

  async create(dto: CreateHarvestDto): Promise<Harvest> {
    await this.getCycleAndValidateOpen(dto.cycleId);

    const harvest = this.harvestRepo.create({
      productionCycleId: dto.cycleId,
      quantityObtained: dto.quantityObtained,
      quality: dto.quality,
      unitSalePrice: dto.unitSalePrice,
      quantitySold: dto.quantitySold,
    });

    return this.harvestRepo.save(harvest);
  }

  async findAllByCycle(cycleId: number): Promise<Harvest[]> {
    return this.harvestRepo.find({
      where: { productionCycleId: cycleId },
      order: { id: 'ASC' },
    });
  }

  async findAll(): Promise<Harvest[]> {
    return this.harvestRepo.find({
      relations: { productionCycle: true },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Harvest> {
    const harvest = await this.harvestRepo.findOne({
      where: { id },
      relations: { productionCycle: true },
    });

    if (!harvest) {
      throw new NotFoundException(`Harvest with id ${id} not found`);
    }

    return harvest;
  }

  async update(id: number, dto: UpdateHarvestDto): Promise<Harvest> {
    const harvest = await this.findOne(id);

    if (harvest.productionCycle.status === 'CLOSED') {
      throw new BadRequestException(
        'Cannot modify a harvest in a closed production cycle',
      );
    }

    Object.assign(harvest, dto);
    return this.harvestRepo.save(harvest);
  }

  async remove(id: number): Promise<void> {
    const harvest = await this.findOne(id);

    if (harvest.productionCycle.status === 'CLOSED') {
      throw new BadRequestException(
        'Cannot delete a harvest from a closed production cycle',
      );
    }

    await this.harvestRepo.remove(harvest);
  }
}
