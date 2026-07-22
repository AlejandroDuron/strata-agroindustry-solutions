import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongPassword123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'operador', required: false, enum: ['admin', 'gerente', 'operador', 'auditor'] })
  @IsOptional()
  @IsString()
  role?: 'admin' | 'gerente' | 'operador' | 'auditor';
}
