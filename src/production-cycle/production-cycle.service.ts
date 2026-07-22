import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionCycle } from './entities/production-cycle.entity';
import { Harvest } from '../harvests/entities/harvest.entity';
import { Input } from '../inputs/entities/input.entity';
import { Field } from '../fields/entities/field.entity';
import { Crop } from '../crops/entities/crop.entity';
import { CreateProductionCycleDto } from './dto/create-production-cycle.dto';
import { UpdateProductionCycleDto } from './dto/update-production-cycle.dto';

@Injectable()
export class ProductionCycleService {
  constructor(
    @InjectRepository(ProductionCycle)
    private readonly cycleRepo: Repository<ProductionCycle>,
    @InjectRepository(Harvest)
    private readonly harvestRepo: Repository<Harvest>,
    @InjectRepository(Input)
    private readonly inputRepo: Repository<Input>,
    @InjectRepository(Field)
    private readonly fieldRepo: Repository<Field>,
    @InjectRepository(Crop)
    private readonly cropRepo: Repository<Crop>,
  ) { }

  async create(dto: CreateProductionCycleDto): Promise<ProductionCycle> {
    const field = await this.fieldRepo.findOne({
      where: { id: dto.fieldId },
      relations: { farm: true },
    });
    if (!field) {
      throw new NotFoundException(`Field with id ${dto.fieldId} not found`);
    }
    if (!field.farm) {
      throw new BadRequestException('Cannot open a production cycle on a field that belongs to a deactivated farm');
    }

    const crop = await this.cropRepo.findOneBy({ id: dto.cropId });
    if (!crop) {
      throw new NotFoundException(`Crop with id ${dto.cropId} not found`);
    }

    // Validate no other OPEN cycle exists for this field
    const existingOpenCycle = await this.cycleRepo.findOne({
      where: { fieldId: dto.fieldId, status: 'OPEN' },
    });

    if (existingOpenCycle) {
      throw new BadRequestException(
        'This field already has an open production cycle. Close it before opening a new one.',
      );
    }

    const cycle = this.cycleRepo.create({
      fieldId: dto.fieldId,
      cropId: dto.cropId,
      sowingDate: dto.sowingDate,
      expectedHarvestDate: dto.expectedHarvestDate,
      estimatedYield: dto.estimatedYield,
      currentCostPerArea: 0,
      status: 'OPEN',
    });

    return this.cycleRepo.save(cycle);
  }

  async findAll(): Promise<ProductionCycle[]> {
    return this.cycleRepo.find({
      relations: { field: true, crop: true },
    });
  }

  async findOne(id: number): Promise<ProductionCycle> {
    const cycle = await this.cycleRepo.findOne({
      where: { id },
      relations: { field: true, crop: true, inputs: true, harvests: true, cropEvents: true },
    });

    if (!cycle) {
      throw new NotFoundException(
        `Production cycle with id ${id} not found`,
      );
    }

    return cycle;
  }

  async update(
    id: number,
    dto: UpdateProductionCycleDto,
  ): Promise<ProductionCycle> {
    const cycle = await this.findOne(id);

    if (cycle.status === 'CLOSED') {
      throw new BadRequestException(
        'Cannot modify a cycle that is already closed',
      );
    }



    if (dto.sowingDate) cycle.sowingDate = dto.sowingDate;
    if (dto.expectedHarvestDate)
      cycle.expectedHarvestDate = dto.expectedHarvestDate;
    if (dto.estimatedYield !== undefined)
      cycle.estimatedYield = dto.estimatedYield;

    return this.cycleRepo.save(cycle);
  }

  async remove(id: number): Promise<void> {
    const cycle = await this.findOne(id);
    if (cycle.status === 'CLOSED') {
      throw new BadRequestException('Cannot delete a closed production cycle');
    }
    await this.cycleRepo.softRemove(cycle);
  }

  /**
   * Closes a production cycle.
   *
   * Business rules:
   * 1. At least 1 harvest must be registered in the cycle.
   * 2. Calculates total revenue: sum(quantitySold * unitSalePrice)
   * 3. Calculates total production cost: sum(quantity * unitCost) from inputs
   * 4. Calculates gross margin: revenue - costs
   * 5. Calculates real yield vs estimated
   * 6. Generates alert if yield falls more than 20% below historical average
   * 7. Updates status to CLOSED
   */
  async close(id: number): Promise<{
    cycle: ProductionCycle;
    yieldAlert: boolean;
    alertMessage: string | null;
    realYield: number;
    estimatedYield: number;
    historicalAvgYield: number | null;
  }> {
    return this.cycleRepo.manager.transaction(async (manager) => {
      // First, lock the row without relations
      const lockedCycle = await manager.findOne(ProductionCycle, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedCycle) {
        throw new NotFoundException(`Production cycle with id ${id} not found`);
      }

      if (lockedCycle.status === 'CLOSED') {
        throw new BadRequestException('The cycle is already closed');
      }

      // Then load relations separately (no lock needed)
      const cycle = await manager.findOne(ProductionCycle, {
        where: { id },
        relations: { field: true, crop: true, harvests: true, inputs: true },
      });

      if (!cycle) {
        throw new NotFoundException(`Production cycle with id ${id} not found`);
      }

      // 1. Validate at least one harvest exists
      if (!cycle.harvests || cycle.harvests.length === 0) {
        throw new BadRequestException(
          'The cycle cannot be closed without at least one registered harvest',
        );
      }

      // 2. Calculate total revenue
      const totalRevenue = cycle.harvests.reduce(
        (sum, h) => sum + h.quantitySold * h.unitSalePrice,
        0,
      );

      // 3. Calculate total production cost
      const totalCost = cycle.inputs.reduce(
        (sum, i) => sum + i.quantity * i.unitCost,
        0,
      );

      // 4. Gross margin
      const grossMargin = totalRevenue - totalCost;

      // 5. Real yield (total quantity obtained)
      const realYield = cycle.harvests.reduce(
        (sum, h) => sum + h.quantityObtained,
        0,
      );

      // 6. Compare with historical average for the same field
      const historicalAvgYield = await this.getHistoricalAverageYield(
        cycle.field.id,
        cycle.id,
      );

      let yieldAlert = false;
      let alertMessage: string | null = null;
      if (historicalAvgYield !== null && historicalAvgYield > 0) {
        const threshold = historicalAvgYield * 0.8; // 20% below
        if (realYield < threshold) {
          yieldAlert = true;
          const dropPercent = (
            ((historicalAvgYield - realYield) / historicalAvgYield) * 100
          ).toFixed(1);
          alertMessage = `The yield of field "${cycle.field.name}" has dropped ${dropPercent}% compared to its historical average (${historicalAvgYield.toFixed(2)} → ${realYield.toFixed(2)})`;
        }
      }

      // 7. Update the cycle
      cycle.totalRevenueAtClose = totalRevenue;
      cycle.totalCostAtClose = totalCost;
      cycle.grossMarginAtClose = grossMargin;
      cycle.realYieldAtClose = realYield;
      cycle.status = 'CLOSED';

      const savedCycle = await manager.save(cycle);

      return {
        cycle: savedCycle,
        yieldAlert,
        alertMessage,
        realYield,
        estimatedYield: cycle.estimatedYield,
        historicalAvgYield,
      };
    });
  }

  /**
   * Calculates the historical average of real yield for a field,
   * excluding the current cycle.
   */
  private async getHistoricalAverageYield(
    fieldId: number,
    excludeCycleId: number,
  ): Promise<number | null> {
    const closedCycles = await this.cycleRepo.find({
      where: { fieldId: fieldId, status: 'CLOSED' },
      relations: { harvests: true },
    });

    const otherCycles = closedCycles.filter((c) => c.id !== excludeCycleId);

    if (otherCycles.length === 0) {
      return null; // No historical data to compare against
    }

    const totalYield = otherCycles.reduce((sum, c) => {
      const cycleYield = c.harvests.reduce(
        (s, h) => s + h.quantityObtained,
        0,
      );
      return sum + cycleYield;
    }, 0);

    return totalYield / otherCycles.length;
  }
}
