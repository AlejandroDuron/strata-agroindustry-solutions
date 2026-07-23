import { IsNotEmpty, IsString, IsNumber, IsPositive, IsInt, MaxLength, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFieldDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Farm id is required' })
  @IsInt({ message: 'Farm id must be an integer' })
  @Min(1, { message: 'Farm id must be greater than 0' })
  farmId: number;

  @ApiProperty({ example: 'Field 1' })
  @IsNotEmpty({ message: 'Field name is required' })
  @IsString()
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({ example: 5.5, description: 'Field area in manzanas' })
  @IsNotEmpty({ message: 'Field area is required' })
  @IsNumber({}, { message: 'Area must be a number' })
  @Min(0.1, { message: 'Area must be at least 0.1 manzanas' })
  @Max(1000, { message: 'Area cannot exceed 1000 manzanas' })
  area: number;
}
