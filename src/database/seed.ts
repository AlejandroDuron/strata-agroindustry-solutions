import { DataSource } from 'typeorm';
import { Role } from '../auth/entities/role.entity';
import { Permission } from '../auth/entities/permission.entity';
import { User } from '../users/entities/user.entity';
import { seedAgroindustry } from './seeds/agroindustry.seed';
import { createUser, getSeedUsers } from './factories';

export async function seedDatabase(dataSource: DataSource) {
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);
  const userRepository = dataSource.getRepository(User);

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

  // --- User seeds ---
  const seedUsers = getSeedUsers();
  for (const userData of seedUsers) {
    const existing = await userRepository.findOne({ where: { email: userData.email } });
    if (!existing) {
      const role = await roleRepository.findOne({ where: { name: userData.roleName } });
      if (role) {
        const userPartial = await createUser(userData, role);
        await userRepository.save(userRepository.create(userPartial));
      }
    }
  }
  console.log(`  Created ${seedUsers.length} users`);

  // --- Agroindustry seeds ---
  await seedAgroindustry(dataSource);
}
