import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

const mockReportsService = () => ({
  getYieldHistory: jest.fn(),
  getFinancialSummary: jest.fn(),
});

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: jest.Mocked<ReturnType<typeof mockReportsService>>;

  beforeEach(() => {
    service = mockReportsService() as any;
    controller = new ReportsController(service as any);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return the yield history', async () => {
    const filter = { fieldId: 1 };
    const response = { fieldId: 1, history: [] };
    service.getYieldHistory.mockResolvedValue(response as any);

    const result = await controller.getYieldHistory(filter as any);

    expect(service.getYieldHistory).toHaveBeenCalledWith(filter);
    expect(result).toEqual(response);
  });

  it('should return the financial summary', async () => {
    const filter = { fieldId: 1 };
    const response = { totalClosedCycles: 0 };
    service.getFinancialSummary.mockResolvedValue(response as any);

    const result = await controller.getFinancialSummary(filter as any);

    expect(service.getFinancialSummary).toHaveBeenCalledWith(filter);
    expect(result).toEqual(response);
  });
});
