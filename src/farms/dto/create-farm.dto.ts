import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFarmDto {
  @ApiProperty({ example: 'Finca El Roble' })
  @IsNotEmpty({ message: 'El nombre de la finca es requerido' })
  @IsString()
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @ApiProperty({ example: 'Santa Ana, El Salvador' })
  @IsNotEmpty({ message: 'La ubicación de la finca es requerida' })
  @IsString()
  @MaxLength(100, { message: 'La ubicación no puede exceder 100 caracteres' })
  location: string;
}
