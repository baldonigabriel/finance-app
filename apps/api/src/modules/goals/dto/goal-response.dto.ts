import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class GoalResponseDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() name: string;
  @Expose() @ApiProperty() targetAmount: number;
  @Expose() @ApiProperty() currentAmount: number;
  @Expose() @ApiProperty() deadline: Date;
  @Expose() @ApiProperty() status: string;
  @Expose() @ApiProperty({ nullable: true }) categoryId: string | null;
  @Expose() @ApiProperty() createdAt: Date;
  @Expose() @ApiProperty() updatedAt: Date;
}
