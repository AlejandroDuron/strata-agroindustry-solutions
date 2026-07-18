import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

export type User = {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
};

@Injectable()
export class UsersService {
  private users: User[] = [];

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user: User = {
      id: (this.users.length + 1).toString(),
      email: createUserDto.email,
      password: hashedPassword,
      role: createUserDto.role ?? 'user',
    };
    this.users.push(user);
    const { password, ...result } = user;
    return result;
  }

  async findAll(): Promise<Array<Omit<User, 'password'>>> {
    return this.users.map(({ password, ...user }) => user);
  }

  async findOne(id: string): Promise<Omit<User, 'password'>> {
    const user = this.users.find((item) => item.id === id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password, ...result } = user;
    return result;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find((user) => user.email === email);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<Omit<User, 'password'>> {
    const index = this.users.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException('User not found');
    }

    const user = this.users[index];
    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    if (updateUserDto.email) {
      user.email = updateUserDto.email;
    }
    if (updateUserDto.role) {
      user.role = updateUserDto.role;
    }

    this.users[index] = user;
    const { password, ...result } = user;
    return result;
  }

  async remove(id: string): Promise<void> {
    const index = this.users.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException('User not found');
    }
    this.users.splice(index, 1);
  }
}
