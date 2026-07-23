import { ProductionCycle } from '../../production-cycle/entities/production-cycle.entity';

export function createProductionCycle(
  overrides: Partial<ProductionCycle> = {},
): Partial<ProductionCycle> {
  return {
    sowingDate: '2026-01-15',
    expectedHarvestDate: '2026-06-15',
    estimatedYield: parseFloat((25 + Math.random() * 20).toFixed(2)), // 25-45 qq/manzana
    currentCostPerArea: 0,
    status: 'OPEN',
    ...overrides,
  };
}
