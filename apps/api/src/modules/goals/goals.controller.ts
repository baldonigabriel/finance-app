import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { GoalResponseDto } from './dto/goal-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

const toDto = (data: unknown) =>
  plainToInstance(GoalResponseDto, data, { excludeExtraneousValues: true });

@ApiTags('goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a financial goal' })
  async create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateGoalDto) {
    const result = await this.goalsService.create(user.userId, dto);
    return toDto(result);
  }

  @Get()
  @ApiOperation({ summary: 'List user goals' })
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    const result = await this.goalsService.findAll(user.userId);
    return toDto(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get goal by ID' })
  async findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    const result = await this.goalsService.findOne(user.userId, id);
    return toDto(result);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a goal' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    const result = await this.goalsService.update(user.userId, id, dto);
    return toDto(result);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a goal' })
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.goalsService.remove(user.userId, id);
  }
}
