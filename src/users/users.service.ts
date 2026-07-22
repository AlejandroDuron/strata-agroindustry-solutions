import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Role } from '../auth/entities/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  private async getOrCreateRole(roleName: string): Promise<Role> {
    const normalizedName = roleName.toLowerCase();
    let role = await this.roleRepository.findOne({ where: { name: normalizedName } });

    if (!role) {
      role = this.roleRepository.create({
        name: normalizedName,
        description: `${normalizedName} role`,
      });
      role = await this.roleRepository.save(role);
    }

    return role;
  }

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    // Check if an active user with the same email exists
    const activeUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (activeUser) {
      throw new ConflictException(`A user with email "${createUserDto.email}" already exists`);
    }

    // Check if a soft-deleted user with the same email exists — restore it
    const deletedUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
      withDeleted: true,
    });

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const role = await this.getOrCreateRole(createUserDto.role ?? 'operador');

    if (deletedUser) {
      deletedUser.deletedAt = null;
      deletedUser.passwordHash = hashedPassword;
      deletedUser.role = role;
      deletedUser.isActive = true;
      const savedUser = await this.userRepository.save(deletedUser);
      const { passwordHash, ...result } = savedUser;
      return result;
    }

    const user = this.userRepository.create({
      name: createUserDto.email.split('@')[0],
      email: createUserDto.email,
      passwordHash: hashedPassword,
      role,
    });

    const savedUser = await this.userRepository.save(user);
    const { passwordHash, ...result } = savedUser;
    return result;
  }

  async findAll(): Promise<Array<Omit<User, 'passwordHash'>>> {
    const users = await this.userRepository.find();
    return users.map(({ passwordHash, ...user }) => user);
  }

  async findOne(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findOne({ where: { id: Number(id) } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findOne({ where: { id: Number(id) } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.password) {
      user.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const duplicate = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (duplicate) {
        throw new ConflictException(`A user with email "${updateUserDto.email}" already exists`);
      }
      user.email = updateUserDto.email;
    }
    if (updateUserDto.role) {
      user.role = await this.getOrCreateRole(updateUserDto.role);
    }

    const savedUser = await this.userRepository.save(user);
    const { passwordHash, ...result } = savedUser;
    return result;
  }

  async remove(id: string, hard = false): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: Number(id) } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (hard) {
      await this.userRepository.remove(user);
    } else {
      await this.userRepository.softRemove(user);
    }
  }
}
