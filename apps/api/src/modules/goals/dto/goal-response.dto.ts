import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class CategoryInGoalDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() icon: string | null;
}

@Exclude()
export class GoalResponseDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() name: string;
  @Expose()
  @Transform(({ value }) => (value?.toNumber ? value.toNumber() : Number(value)))
  @ApiProperty()
  targetAmount: number;

  @Expose()
  @Transform(({ value }) => (value?.toNumber ? value.toNumber() : Number(value)))
  @ApiProperty()
  currentAmount: number;
  @Expose() @ApiProperty() deadline: Date;
  @Expose() @ApiProperty() status: string;
  @Expose() @ApiProperty() createdAt: Date;
  @Expose() @ApiProperty() updatedAt: Date;

  @Expose()
  @Type(() => CategoryInGoalDto)
  @ApiProperty({ nullable: true })
  category: CategoryInGoalDto | null;
}
