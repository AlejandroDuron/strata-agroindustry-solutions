import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFarmDto {
  @ApiProperty({ example: 'Finca El Roble' })
  @IsNotEmpty({ message: 'Farm name is required' })
  @IsString()
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({ example: 'Santa Ana, El Salvador' })
  @IsNotEmpty({ message: 'Farm location is required' })
  @IsString()
  @MaxLength(100, { message: 'Location cannot exceed 100 characters' })
  location: string;
}
