import { Input } from '../../inputs/entities/input.entity';

const INPUT_TYPES = ['fertilizer', 'pesticide', 'labor', 'herbicide', 'seeds'];

export function createInput(overrides: Partial<Input> = {}, index = 0): Partial<Input> {
  return {
    inputType: INPUT_TYPES[index % INPUT_TYPES.length],
    quantity: parseFloat((1 + Math.random() * 10).toFixed(2)),
    unitCost: parseFloat((5 + Math.random() * 50).toFixed(2)),
    ...overrides,
  };
}
