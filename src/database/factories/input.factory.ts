import { Input } from '../../inputs/entities/input.entity';

const INPUT_TYPES = ['FERTILIZER', 'PESTICIDE', 'LABOR', 'FERTILIZER', 'OTHER'];

const INPUT_NAMES = [
  'Urea 46%',
  'Cypermethrin 25%',
  'Jornalero cosecha',
  'NPK 15-15-15',
  'Transporte interno',
];

const UNITS = ['kg', 'lt', 'jornal', 'kg', 'viaje'];

export function createInput(overrides: Partial<Input> = {}, index = 0): Partial<Input> {
  return {
    name: INPUT_NAMES[index % INPUT_NAMES.length],
    type: INPUT_TYPES[index % INPUT_TYPES.length] as any,
    quantity: parseFloat((1 + Math.random() * 10).toFixed(2)),
    unitCost: parseFloat((5 + Math.random() * 50).toFixed(2)),
    unit: UNITS[index % UNITS.length],
    applicationDate: '2026-03-15',
    ...overrides,
  };
}
