import { Harvest } from '../../harvests/entities/harvest.entity';

const QUALITIES = ['A', 'B', 'C'];

export function createHarvest(overrides: Partial<Harvest> = {}, index = 0): Partial<Harvest> {
  const quantityObtained = parseFloat((10 + Math.random() * 30).toFixed(2));
  return {
    quantityObtained,
    quality: QUALITIES[index % QUALITIES.length],
    unitSalePrice: parseFloat((80 + Math.random() * 70).toFixed(2)), // $80-$150 per qq
    quantitySold: parseFloat((quantityObtained * (0.7 + Math.random() * 0.3)).toFixed(2)),
    ...overrides,
  };
}
