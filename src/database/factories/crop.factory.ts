import { Crop } from '../../crops/entities/crop.entity';

const CROPS = [
  { type: 'Café', variety: 'Bourbon' },
  { type: 'Café', variety: 'Pacamara' },
  { type: 'Maíz', variety: 'H-59' },
  { type: 'Frijol', variety: 'Rojo de Seda' },
  { type: 'Caña de Azúcar', variety: 'CP 72-2086' },
];

export function createCrop(overrides: Partial<Crop> = {}, index = 0): Partial<Crop> {
  const base = CROPS[index % CROPS.length];
  return {
    type: base.type,
    variety: base.variety,
    ...overrides,
  };
}
