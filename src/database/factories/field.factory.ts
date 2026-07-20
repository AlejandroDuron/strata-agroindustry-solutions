import { Field } from '../../fields/entities/field.entity';

const FIELD_NAMES = [
  'Lote La Ceiba',
  'Lote El Río',
  'Lote Norte',
  'Lote Sur',
  'Lote Central',
];

export function createField(overrides: Partial<Field> = {}, index = 0): Partial<Field> {
  return {
    name: FIELD_NAMES[index % FIELD_NAMES.length],
    area: parseFloat((2 + Math.random() * 8).toFixed(2)), // 2-10 manzanas
    ...overrides,
  };
}
