import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from './create-transaction.dto';

class CategoryInTransactionDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() icon: string | null;
}

@Exclude()
export class TransactionResponseDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty({ enum: TransactionType }) type: TransactionType;
  @Expose()
  @Transform(({ value }) => (value?.toNumber ? value.toNumber() : Number(value)))
  @ApiProperty()
  amount: number;
  @Expose() @ApiProperty({ nullable: true }) description: string | null;
  @Expose() @ApiProperty() date: Date;
  @Expose() @ApiProperty() createdAt: Date;

  @Expose()
  @Type(() => CategoryInTransactionDto)
  @ApiProperty()
  category: CategoryInTransactionDto;
}
