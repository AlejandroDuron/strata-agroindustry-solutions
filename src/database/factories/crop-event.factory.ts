import { CropEvent } from '../../crop-events/entities/crop-event.entity';

const EVENT_TYPES = ['irrigation', 'fumigation', 'disease', 'pruning', 'fertilization'];

const DESCRIPTIONS = [
  'Routine irrigation cycle',
  'Preventive fumigation against roya',
  'Detected leaf rust on sector B',
  'Seasonal pruning completed',
  'Applied foliar fertilizer',
];

export function createCropEvent(overrides: Partial<CropEvent> = {}, index = 0): Partial<CropEvent> {
  return {
    eventType: EVENT_TYPES[index % EVENT_TYPES.length],
    eventDate: '2026-03-01',
    description: DESCRIPTIONS[index % DESCRIPTIONS.length],
    ...overrides,
  };
}
