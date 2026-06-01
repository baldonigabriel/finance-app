import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Alimentação' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'utensils', required: false })
  @IsOptional()
  @IsString()
  icon?: string;
}
