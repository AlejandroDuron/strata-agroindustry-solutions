import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'newuser@farm.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'myPassword123', description: 'Password (minimum 6 characters)' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
