import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'new.email@strata.com', description: 'New email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'NewPass123!', description: 'New password (minimum 6 characters)' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({
    example: 'gerente',
    enum: ['admin', 'gerente', 'operador', 'auditor'],
    description: 'New user role',
  })
  @IsOptional()
  @IsString()
  role?: 'admin' | 'gerente' | 'operador' | 'auditor';
}
