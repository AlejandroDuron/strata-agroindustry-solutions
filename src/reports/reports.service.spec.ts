import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service';

const mockRepository = () => ({
  find: jest.fn(),
});

describe('ReportsService', () => {
  let service: ReportsService;
  let cycleRepo: jest.Mocked<ReturnType<typeof mockRepository>>;

  beforeEach(() => {
    cycleRepo = mockRepository() as any;
    service = new ReportsService(cycleRepo as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getYieldHistory', () => {
    it('should throw BadRequestException when fieldId is missing', async () => {
      await expect(service.getYieldHistory({} as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when there are no closed cycles for the field', async () => {
      cycleRepo.find.mockResolvedValue([]);

      await expect(service.getYieldHistory({ fieldId: 1 } as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return the yield history without an alert when performance is normal', async () => {
      cycleRepo.find.mockResolvedValue([
        {
          id: 1,
          field: { id: 1, name: 'Lote 1', area: 5 },
          crop: { variety: 'Arabica' },
          sowingDate: '2025-01-01',
          expectedHarvestDate: '2025-06-01',
          estimatedYield: 25,
          realYieldAtClose: 26,
          harvests: [],
        },
      ] as any);

      const result = await service.getYieldHistory({ fieldId: 1 } as any);

      expect(result.fieldId).toBe(1);
      expect(result.isYieldAlertTriggered).toBe(false);
      expect(result.history).toHaveLength(1);
    });

    it('should trigger an alert when the latest yield drops more than 20%', async () => {
      cycleRepo.find.mockResolvedValue([
        {
          id: 1,
          field: { id: 1, name: 'Lote 1', area: 5 },
          crop: { variety: 'Arabica' },
          sowingDate: '2025-01-01',
          expectedHarvestDate: '2025-06-01',
          estimatedYield: 25,
          realYieldAtClose: 40,
          harvests: [],
        },
        {
          id: 2,
          field: { id: 1, name: 'Lote 1', area: 5 },
          crop: { variety: 'Arabica' },
          sowingDate: '2025-07-01',
          expectedHarvestDate: '2025-12-01',
          estimatedYield: 25,
          realYieldAtClose: 10,
          harvests: [],
        },
      ] as any);

      const result = await service.getYieldHistory({ fieldId: 1 } as any);

      expect(result.isYieldAlertTriggered).toBe(true);
      expect(result.alertMessage).toContain('ALERTA');
    });

    it('should fallback to totalHarvested/fieldArea when realYieldAtClose is null', async () => {
      cycleRepo.find.mockResolvedValue([
        {
          id: 1,
          field: { id: 1, name: 'Lote 1', area: 5 },
          crop: { variety: 'Arabica' },
          sowingDate: '2025-01-01',
          expectedHarvestDate: '2025-06-01',
          estimatedYield: 25,
          realYieldAtClose: null,
          harvests: [{ quantityObtained: 50 }],
        },
      ] as any);

      const result = await service.getYieldHistory({ fieldId: 1 } as any);

      expect(result.history[0].realYield).toBe(10); // 50 / 5 = 10
    });

    it('should set variancePercentage to 0% when estimatedYield is 0', async () => {
      cycleRepo.find.mockResolvedValue([
        {
          id: 1,
          field: { id: 1, name: 'Lote 1', area: 5 },
          crop: { variety: 'Arabica' },
          sowingDate: '2025-01-01',
          expectedHarvestDate: '2025-06-01',
          estimatedYield: 0,
          realYieldAtClose: 20,
          harvests: [],
        },
      ] as any);

      const result = await service.getYieldHistory({ fieldId: 1 } as any);

      expect(result.history[0].variancePercentage).toBe('0%');
    });
  });

  describe('getFinancialSummary', () => {
    it('should return a zeroed summary when there are no closed cycles', async () => {
      cycleRepo.find.mockResolvedValue([]);

      const result = await service.getFinancialSummary({} as any);

      expect(result).toEqual({
        totalClosedCycles: 0,
        totalRevenue: 0,
        totalProductionCost: 0,
        totalGrossMargin: 0,
        overallProfitability: '0%',
        cyclesBreakdown: [],
      });
    });

    it('should aggregate revenue, cost, and margin across cycles', async () => {
      cycleRepo.find.mockResolvedValue([
        {
          id: 1,
          field: { name: 'Lote 1' },
          crop: { variety: 'Arabica' },
          sowingDate: '2025-01-01',
          totalRevenueAtClose: 1000,
          totalCostAtClose: 400,
          grossMarginAtClose: 600,
        },
        {
          id: 2,
          fieldId: 2,
          crop: { type: 'Maize' },
          sowingDate: '2025-02-01',
          totalRevenueAtClose: 500,
          totalCostAtClose: 300,
          grossMarginAtClose: 200,
        },
      ] as any);

      const result = await service.getFinancialSummary({ fieldId: 1 } as any);

      expect(result.totalClosedCycles).toBe(2);
      expect(result.totalRevenue).toBe(1500);
      expect(result.totalProductionCost).toBe(700);
      expect(result.totalGrossMargin).toBe(800);
      expect(cycleRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'CLOSED', fieldId: 1 }) }),
      );
    });

    it('should apply the date range filter when both dates are provided', async () => {
      cycleRepo.find.mockResolvedValue([]);

      await service.getFinancialSummary({ startDate: '2025-01-01', endDate: '2025-12-31' } as any);

      const callArg = cycleRepo.find.mock.calls[0][0] as any;
      expect(callArg.where.sowingDate).toBeDefined();
    });

    it('should fallback to revenue - cost when grossMarginAtClose is null', async () => {
      cycleRepo.find.mockResolvedValue([
        {
          id: 1,
          field: { name: 'Lote 1' },
          crop: { variety: 'Arabica' },
          sowingDate: '2025-01-01',
          totalRevenueAtClose: 1000,
          totalCostAtClose: 400,
          grossMarginAtClose: null,
        },
      ] as any);

      const result = await service.getFinancialSummary({} as any);

      expect(result.cyclesBreakdown[0].grossMargin).toBe(600); // 1000 - 400
    });

    it('should handle cycles with zero revenue (profitability = 0%)', async () => {
      cycleRepo.find.mockResolvedValue([
        {
          id: 1,
          field: { name: 'Lote 1' },
          crop: { variety: 'Arabica' },
          sowingDate: '2025-01-01',
          totalRevenueAtClose: 0,
          totalCostAtClose: 500,
          grossMarginAtClose: -500,
        },
      ] as any);

      const result = await service.getFinancialSummary({} as any);

      expect(result.overallProfitability).toBe('0%');
    });

    it('should not apply date filter when only startDate is provided', async () => {
      cycleRepo.find.mockResolvedValue([]);

      await service.getFinancialSummary({ startDate: '2025-01-01' } as any);

      const callArg = cycleRepo.find.mock.calls[0][0] as any;
      expect(callArg.where.sowingDate).toBeUndefined();
    });
  });
});
