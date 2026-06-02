import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '4821' })
  @IsString()
  @Length(4, 4, { message: 'O código deve ter exatamente 4 dígitos' })
  code: string;
}
