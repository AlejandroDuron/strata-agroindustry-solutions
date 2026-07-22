import * as bcrypt from 'bcryptjs';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../auth/entities/role.entity';

export interface UserSeedData {
  name: string;
  email: string;
  password: string;
  roleName: string;
}

const SEED_USERS: UserSeedData[] = [
  { name: 'Admin User', email: 'admin@strata.com', password: 'Admin123!', roleName: 'admin' },
  { name: 'Gerente User', email: 'gerente@strata.com', password: 'Gerente123!', roleName: 'gerente' },
  { name: 'Operador User', email: 'operador@strata.com', password: 'Operador123!', roleName: 'operador' },
  { name: 'Auditor User', email: 'auditor@strata.com', password: 'Auditor123!', roleName: 'auditor' },
];

export function getSeedUsers(): UserSeedData[] {
  return SEED_USERS;
}

export async function createUser(
  data: UserSeedData,
  role: Role,
): Promise<Partial<User>> {
  const passwordHash = await bcrypt.hash(data.password, 10);
  return {
    name: data.name,
    email: data.email,
    passwordHash,
    isActive: true,
    role,
  };
}
