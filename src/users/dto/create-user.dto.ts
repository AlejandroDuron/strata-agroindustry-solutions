import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'new.manager@strata.com', description: 'New user email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Password (minimum 6 characters)' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'operador',
    required: false,
    enum: ['admin', 'gerente', 'operador', 'auditor'],
    description: 'User role. If not specified, defaults to "operador".',
  })
  @IsOptional()
  @IsString()
  role?: 'admin' | 'gerente' | 'operador' | 'auditor';
}
