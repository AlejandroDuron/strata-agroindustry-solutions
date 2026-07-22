import { DataSource } from 'typeorm';
import { Role } from '../auth/entities/role.entity';
import { Permission } from '../auth/entities/permission.entity';
import { seedAgroindustry } from './seeds/agroindustry.seed';

export async function seedDatabase(dataSource: DataSource) {
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);

  // --- Auth seeds ---
  const roles = [
    { name: 'admin', description: 'Dueño de la finca. Control total sobre todos los recursos.' },
    { name: 'gerente', description: 'Gestiona fincas, lotes (fields) y ciclos productivos. No registra operaciones diarias.' },
    { name: 'operador', description: 'Registra actividades diarias: eventos, insumos, cosechas. No puede crear/eliminar fincas ni lotes.' },
    { name: 'auditor', description: 'Solo lectura sobre reportes financieros y de rendimiento.' },
  ];

  for (const role of roles) {
    const existing = await roleRepository.findOne({ where: { name: role.name } });
    if (!existing) {
      await roleRepository.save(roleRepository.create(role));
    }
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
