import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'A3KX7M' })
  @IsString()
  @Length(6, 6, { message: 'O código deve ter exatamente 6 caracteres' })
  code: string;
}
