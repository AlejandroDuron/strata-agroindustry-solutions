import { DataSource } from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';
import { Field } from '../../fields/entities/field.entity';
import { Crop } from '../../crops/entities/crop.entity';
import { ProductionCycle } from '../../production-cycle/entities/production-cycle.entity';
import { Input } from '../../inputs/entities/input.entity';
import { CropEvent } from '../../crop-events/entities/crop-event.entity';
import { Harvest } from '../../harvests/entities/harvest.entity';
import {
  createFarm,
  createField,
  createCrop,
  createProductionCycle,
  createInput,
  createCropEvent,
  createHarvest,
} from '../factories';

export async function seedAgroindustry(dataSource: DataSource): Promise<void> {
  const farmRepo = dataSource.getRepository(Farm);
  const fieldRepo = dataSource.getRepository(Field);
  const cropRepo = dataSource.getRepository(Crop);
  const cycleRepo = dataSource.getRepository(ProductionCycle);
  const inputRepo = dataSource.getRepository(Input);
  const eventRepo = dataSource.getRepository(CropEvent);
  const harvestRepo = dataSource.getRepository(Harvest);

  // Skip if data already exists
  const existingFarms = await farmRepo.count();
  if (existingFarms > 0) {
    console.log('Agroindustry data already seeded. Skipping.');
    return;
  }

  console.log('Seeding agroindustry data...');

  // --- Farms ---
  const farms: Farm[] = [];
  for (let i = 0; i < 3; i++) {
    const farm = farmRepo.create(createFarm({}, i));
    farms.push(await farmRepo.save(farm));
  }
  console.log(`  Created ${farms.length} farms`);

  // --- Fields (2-3 per farm) ---
  const fields: Field[] = [];
  let fieldIndex = 0;
  for (const farm of farms) {
    const fieldCount = 2 + Math.floor(Math.random() * 2); // 2-3
    for (let i = 0; i < fieldCount; i++) {
      const field = fieldRepo.create(createField({ farmId: farm.id }, fieldIndex));
      fields.push(await fieldRepo.save(field));
      fieldIndex++;
    }
  }
  console.log(`  Created ${fields.length} fields`);

  // --- Crops ---
  const crops: Crop[] = [];
  for (let i = 0; i < 5; i++) {
    const crop = cropRepo.create(createCrop({}, i));
    crops.push(await cropRepo.save(crop));
  }
  console.log(`  Created ${crops.length} crops`);

  // --- Production Cycles (1 closed + 1 open per field) ---
  const cycles: ProductionCycle[] = [];
  for (const field of fields) {
    const crop = crops[Math.floor(Math.random() * crops.length)];

    // Closed cycle (past season)
    const closedCycle = cycleRepo.create(
      createProductionCycle({
        field,
        crop,
        sowingDate: '2025-05-01',
        expectedHarvestDate: '2025-11-15',
        status: 'CLOSED',
        totalRevenueAtClose: 12000 + Math.random() * 8000,
        totalCostAtClose: 4000 + Math.random() * 3000,
        grossMarginAtClose: 0,
        realYieldAtClose: 20 + Math.random() * 15,
      }),
    );
    closedCycle.grossMarginAtClose =
      closedCycle.totalRevenueAtClose - closedCycle.totalCostAtClose;
    cycles.push(await cycleRepo.save(closedCycle));

    // Open cycle (current season)
    const openCycle = cycleRepo.create(
      createProductionCycle({
        field,
        crop,
        sowingDate: '2026-01-15',
        expectedHarvestDate: '2026-06-30',
        status: 'OPEN',
      }),
    );
    cycles.push(await cycleRepo.save(openCycle));
  }
  console.log(`  Created ${cycles.length} production cycles`);

  // --- Inputs (2-4 per cycle) ---
  let inputCount = 0;
  for (const cycle of cycles) {
    const count = 2 + Math.floor(Math.random() * 3);
    let totalCost = 0;
    for (let i = 0; i < count; i++) {
      const input = inputRepo.create(
        createInput({ productionCycle: cycle }, inputCount),
      );
      const saved = await inputRepo.save(input);
      totalCost += saved.quantity * saved.unitCost;
      inputCount++;
    }
    // Recalculate currentCostPerArea for the cycle
    const field = fields.find((f) => f.id === cycle.fieldId);
    const area = field?.area || 1;
    cycle.currentCostPerArea = parseFloat((totalCost / area).toFixed(2));
    await cycleRepo.save(cycle);
  }
  console.log(`  Created ${inputCount} inputs`);

  // --- Crop Events (2-3 per cycle) ---
  let eventCount = 0;
  for (const cycle of cycles) {
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const event = eventRepo.create(
        createCropEvent({ productionCycle: cycle }, eventCount),
      );
      await eventRepo.save(event);
      eventCount++;
    }
  }
  console.log(`  Created ${eventCount} crop events`);

  // --- Harvests (1-3 per closed cycle, 0-1 per open cycle) ---
  let harvestCount = 0;
  for (const cycle of cycles) {
    const count =
      cycle.status === 'CLOSED'
        ? 1 + Math.floor(Math.random() * 3)
        : Math.round(Math.random()); // 0 or 1
    for (let i = 0; i < count; i++) {
      const harvest = harvestRepo.create(
        createHarvest({ productionCycle: cycle }, harvestCount),
      );
      await harvestRepo.save(harvest);
      harvestCount++;
    }
  }
  console.log(`  Created ${harvestCount} harvests`);

  console.log('Agroindustry seed complete!');
}
