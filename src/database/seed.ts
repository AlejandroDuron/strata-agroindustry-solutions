import { DataSource } from 'typeorm';
import { Role } from '../auth/entities/role.entity';
import { Permission } from '../auth/entities/permission.entity';
import { seedAgroindustry } from './seeds/agroindustry.seed';

export async function seedDatabase(dataSource: DataSource) {
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);

  // --- Auth seeds ---
  const adminRole = await roleRepository.findOne({ where: { name: 'admin' } });
  if (!adminRole) {
    await roleRepository.save(roleRepository.create({ name: 'admin', description: 'Administrator role' }));
  }

  const userRole = await roleRepository.findOne({ where: { name: 'user' } });
  if (!userRole) {
    await roleRepository.save(roleRepository.create({ name: 'user', description: 'Standard user role' }));
  }

  const permissions = [
    'farms.read',
    'farms.write',
    'fields.read',
    'fields.write',
    'crops.read',
    'crops.write',
    'cycles.read',
    'cycles.write',
    'harvests.read',
    'harvests.write',
    'inputs.read',
    'inputs.write',
    'reports.read',
  ];

  for (const permissionName of permissions) {
    const existing = await permissionRepository.findOne({ where: { name: permissionName } });
    if (!existing) {
      await permissionRepository.save(permissionRepository.create({ name: permissionName, description: permissionName }));
    }
  }

  // --- Agroindustry seeds ---
  await seedAgroindustry(dataSource);
}
