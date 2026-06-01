import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum TransactionType {
  income = 'income',
  expense = 'expense',
}

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType, example: TransactionType.expense })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ example: 150.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: 'uuid-da-categoria' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 'Almoço no restaurante', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2024-01-15T12:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  date?: string;
}
