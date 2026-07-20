import { IsNotEmpty, IsString, IsNumber, IsPositive, IsInt, MaxLength, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFieldDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Farm id is required' })
  @IsInt({ message: 'Farm id must be an integer' })
  farmId: number;

  @ApiProperty({ example: 'Lote 1' })
  @IsNotEmpty({ message: 'Field name is required' })
  @IsString()
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({ example: 5.5 })
  @IsNotEmpty({ message: 'Field area is required' })
  @IsNumber({}, { message: 'Area must be a number' })
  @IsPositive({ message: 'Area must be greater than 0' })
  @Max(1000, { message: 'Area cannot exceed 1000 manzanas' })
  area: number;
}
