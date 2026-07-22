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
  });
});
