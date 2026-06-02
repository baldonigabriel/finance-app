import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GoalStatus } from '@finance-app/shared';
import { CreateGoalDto } from './create-goal.dto';

export { GoalStatus };

export class UpdateGoalDto extends PartialType(CreateGoalDto) {
  @ApiProperty({ enum: GoalStatus, required: false })
  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  currentAmount?: number;
}
