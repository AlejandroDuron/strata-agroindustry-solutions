import { CropEvent } from '../../crop-events/entities/crop-event.entity';

const EVENT_TYPES = ['IRRIGATION', 'FUMIGATION', 'DISEASE_DETECTED', 'PRUNING', 'FERTILIZATION'];

const DESCRIPTIONS = [
  'Routine irrigation cycle',
  'Preventive fumigation against roya',
  'Detected leaf rust on sector B',
  'Seasonal pruning completed',
  'Applied foliar fertilizer',
];

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'LOW', 'MEDIUM'];

export function createCropEvent(overrides: Partial<CropEvent> = {}, index = 0): Partial<CropEvent> {
  return {
    eventType: EVENT_TYPES[index % EVENT_TYPES.length] as any,
    eventDate: '2026-03-01',
    description: DESCRIPTIONS[index % DESCRIPTIONS.length],
    severity: SEVERITIES[index % SEVERITIES.length] as any,
    ...overrides,
  };
}
