import { IsNotEmpty, IsString, IsNumber, IsPositive, IsInt, MaxLength, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFieldDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'El id de la finca es requerido' })
  @IsInt({ message: 'El id de la finca debe ser un número entero' })
  farmId: number;

  @ApiProperty({ example: 'Lote 1' })
  @IsNotEmpty({ message: 'El nombre del lote es requerido' })
  @IsString()
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @ApiProperty({ example: 5.5 })
  @IsNotEmpty({ message: 'El área del lote es requerida' })
  @IsNumber({}, { message: 'El área debe ser un número' })
  @IsPositive({ message: 'El área debe ser mayor a 0' })
  @Max(1000, { message: 'El área no puede exceder 1000 manzanas' })
  area: number;
}
