import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendCodeDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail()
  email: string;
}
