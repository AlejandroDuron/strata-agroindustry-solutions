import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'nuevo.email@strata.com', description: 'Nuevo correo electrónico' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'NuevaPass123!', description: 'Nueva contraseña (mínimo 6 caracteres)' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({
    example: 'gerente',
    enum: ['admin', 'gerente', 'operador', 'auditor'],
    description: 'Nuevo rol del usuario',
  })
  @IsOptional()
  @IsString()
  role?: 'admin' | 'gerente' | 'operador' | 'auditor';
}
