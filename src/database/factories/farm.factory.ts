import { Farm } from '../../farms/entities/farm.entity';

const FARM_NAMES = [
  'Finca El Roble',
  'Finca La Esperanza',
  'Finca San José',
  'Finca Los Pinos',
  'Finca El Volcán',
];

const LOCATIONS = [
  'Santa Ana, El Salvador',
  'Ahuachapán, El Salvador',
  'Sonsonate, El Salvador',
  'La Libertad, El Salvador',
  'Usulután, El Salvador',
];

export function createFarm(overrides: Partial<Farm> = {}, index = 0): Partial<Farm> {
  return {
    name: FARM_NAMES[index % FARM_NAMES.length],
    location: LOCATIONS[index % LOCATIONS.length],
    ...overrides,
  };
}
