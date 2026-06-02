import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

const toDto = (data: unknown) =>
  plainToInstance(TransactionResponseDto, data, { excludeExtraneousValues: true });

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a transaction' })
  async create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateTransactionDto) {
    const result = await this.transactionsService.create(user.userId, dto);
    return toDto(result);
  }

  @Get()
  @ApiOperation({ summary: 'List transactions with optional filters' })
  async findAll(@CurrentUser() user: CurrentUserPayload, @Query() filters: FilterTransactionDto) {
    const { data, total, page, limit } = await this.transactionsService.findAll(user.userId, filters);
    return { data: toDto(data), total, page, limit };
  }

  @Get('monthly-summary')
  @ApiOperation({ summary: 'Monthly summaries for the last N months' })
  @ApiQuery({ name: 'months', required: false, type: Number })
  getMonthlySummaries(
    @CurrentUser() user: CurrentUserPayload,
    @Query('months', new DefaultValuePipe(6), ParseIntPipe) months: number,
  ) {
    return this.transactionsService.getMonthlySummaries(user.userId, Math.min(Math.max(months, 1), 24));
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumo financeiro do período' })
  getSummary(
    @CurrentUser() user: CurrentUserPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.transactionsService.getSummary(
      user.userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  async findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    const result = await this.transactionsService.findOne(user.userId, id);
    return toDto(result);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    const result = await this.transactionsService.update(user.userId, id, dto);
    return toDto(result);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a transaction (soft delete)' })
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.transactionsService.remove(user.userId, id);
  }
}
