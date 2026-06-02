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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

const toDto = (data: unknown) =>
  plainToInstance(CategoryResponseDto, data, { excludeExtraneousValues: true });

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  async create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateCategoryDto) {
    const result = await this.categoriesService.create(user.userId, dto);
    return toDto(result);
  }

  @Get()
  @ApiOperation({ summary: 'List user categories' })
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    const result = await this.categoriesService.findAll(user.userId);
    return toDto(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  async findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    const result = await this.categoriesService.findOne(user.userId, id);
    return toDto(result);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const result = await this.categoriesService.update(user.userId, id, dto);
    return toDto(result);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category' })
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.categoriesService.remove(user.userId, id);
  }
}
