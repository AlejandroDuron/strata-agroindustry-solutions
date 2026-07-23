import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ProductionCycle } from '../production-cycle/entities/production-cycle.entity';
import { GetReportsFilterDto } from './dto/get-reports-filter.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ProductionCycle)
    private readonly productionCycleRepo: Repository<ProductionCycle>,
  ) {}

  async getYieldHistory(filter: GetReportsFilterDto) {
    if (!filter.fieldId) {
      throw new BadRequestException('The fieldId parameter is required to query yield history.');
    }

    const cycles = await this.productionCycleRepo.find({
      where: {
        fieldId: filter.fieldId,
        status: 'CLOSED',
      },
      relations: {
        field: true,
        crop: true,
        harvests: true,
      },
      order: { sowingDate: 'ASC' },
    });

    if (cycles.length === 0) {
      throw new NotFoundException(`No closed production cycles found for field ID ${filter.fieldId}.`);
    }

    const history = cycles.map((cycle) => {
      const totalHarvested = cycle.harvests?.reduce((sum, harvest: any) => {
        const qty = harvest.quantityObtained || harvest.quantity || harvest.amount || harvest.totalQuantity || 0;
        return sum + Number(qty);
      }, 0) || 0;

      const fieldArea = Number((cycle.field as any)?.area || (cycle.field as any)?.areaInHectares || 1);
      const realYield = cycle.realYieldAtClose !== null && cycle.realYieldAtClose !== undefined
        ? Number(cycle.realYieldAtClose)
        : Number((totalHarvested / fieldArea).toFixed(2));

      const estimatedYield = Number(cycle.estimatedYield || 0);

      const variancePercentage = estimatedYield > 0
        ? Number((((realYield - estimatedYield) / estimatedYield) * 100).toFixed(2))
        : 0;

      return {
        cycleId: cycle.id,
        crop: (cycle.crop as any)?.variety || (cycle.crop as any)?.type || (cycle.crop as any)?.name || 'Unknown',
        sowingDate: cycle.sowingDate,
        expectedHarvestDate: cycle.expectedHarvestDate,
        estimatedYield,
        realYield,
        variancePercentage: `${variancePercentage}%`,
      };
    });

    const totalRealYield = history.reduce((sum, item) => sum + item.realYield, 0);
    const historicalAverage = Number((totalRealYield / history.length).toFixed(2));
    const latestCycle = history[history.length - 1];

    const alertThreshold = historicalAverage * 0.8;
    const isYieldAlertTriggered = latestCycle.realYield < alertThreshold;

    return {
      fieldId: filter.fieldId,
      fieldName: (cycles[0].field as any)?.name || `Field #${filter.fieldId}`,
      fieldArea: (cycles[0].field as any)?.area || 'N/A',
      historicalAverageYield: historicalAverage,
      isYieldAlertTriggered,
      alertMessage: isYieldAlertTriggered
        ? `BUSINESS ALERT! The latest cycle yield (${latestCycle.realYield}) dropped more than 20% below the field's historical average (${historicalAverage}).`
        : 'Optimal yield: The latest cycle is within normal historical parameters.',
      history,
    };
  }

  async getFinancialSummary(filter: GetReportsFilterDto) {
    const whereCondition: any = { status: 'CLOSED' };

    if (filter.fieldId) {
      whereCondition.fieldId = filter.fieldId;
    }
    if (filter.startDate && filter.endDate) {
      whereCondition.sowingDate = Between(filter.startDate, filter.endDate);
    }

    const cycles = await this.productionCycleRepo.find({
      where: whereCondition,
      relations: {
        field: true,
        crop: true,
      },
      order: { sowingDate: 'DESC' },
    });

    if (cycles.length === 0) {
      return {
        totalClosedCycles: 0,
        totalRevenue: 0,
        totalProductionCost: 0,
        totalGrossMargin: 0,
        overallProfitability: '0%',
        cyclesBreakdown: [],
      };
    }

    let totalRevenue = 0;
    let totalProductionCost = 0;

    const cyclesBreakdown = cycles.map((cycle) => {
      const revenue = Number(cycle.totalRevenueAtClose || 0);
      const cost = Number(cycle.totalCostAtClose || 0);
      const margin = Number(cycle.grossMarginAtClose !== null && cycle.grossMarginAtClose !== undefined ? cycle.grossMarginAtClose : (revenue - cost));

      totalRevenue += revenue;
      totalProductionCost += cost;

      return {
        cycleId: cycle.id,
        field: (cycle.field as any)?.name || `Field #${cycle.fieldId}`,
        crop: (cycle.crop as any)?.variety || (cycle.crop as any)?.type || (cycle.crop as any)?.name || 'N/A',
        sowingDate: cycle.sowingDate,
        revenue: Number(revenue.toFixed(2)),
        productionCost: Number(cost.toFixed(2)),
        grossMargin: Number(margin.toFixed(2)),
      };
    });

    const totalGrossMargin = Number((totalRevenue - totalProductionCost).toFixed(2));
    const overallProfitability = totalRevenue > 0
      ? Number(((totalGrossMargin / totalRevenue) * 100).toFixed(2))
      : 0;

    return {
      totalClosedCycles: cycles.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalProductionCost: Number(totalProductionCost.toFixed(2)),
      totalGrossMargin,
      overallProfitability: `${overallProfitability}%`,
      cyclesBreakdown,
    };
  }
}