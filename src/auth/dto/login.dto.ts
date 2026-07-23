import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@strata.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin123!', description: 'User password' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
