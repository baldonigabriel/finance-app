import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'a3f9c2...' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'novaSenha123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
