import { DataSource } from 'typeorm';
import { Role } from '../auth/entities/role.entity';
import { Permission } from '../auth/entities/permission.entity';

export async function seedDatabase(dataSource: DataSource) {
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);

  const adminRole = await roleRepository.findOne({ where: { name: 'admin' } });
  if (!adminRole) {
    await roleRepository.save(roleRepository.create({ name: 'admin', description: 'Administrator role' }));
  }

  const userRole = await roleRepository.findOne({ where: { name: 'user' } });
  if (!userRole) {
    await roleRepository.save(roleRepository.create({ name: 'user', description: 'Standard user role' }));
  }

  const permissions = [
    'users.read',
    'users.write',
    'users.delete',
    'products.read',
    'products.write',
  ];

  for (const permissionName of permissions) {
    const existing = await permissionRepository.findOne({ where: { name: permissionName } });
    if (!existing) {
      await permissionRepository.save(permissionRepository.create({ name: permissionName, description: permissionName }));
    }
  }
}
