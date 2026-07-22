import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'nuevo.gerente@strata.com', description: 'Correo electrónico del nuevo usuario' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Contraseña (mínimo 6 caracteres)' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'operador',
    required: false,
    enum: ['admin', 'gerente', 'operador', 'auditor'],
    description: 'Rol del usuario. Si no se especifica, se asigna "operador" por defecto.',
  })
  @IsOptional()
  @IsString()
  role?: 'admin' | 'gerente' | 'operador' | 'auditor';
}
