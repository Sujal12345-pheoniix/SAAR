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
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { PlansService } from './plans.service';

class CreatePlanDto {
  @IsOptional()
  @IsString()
  localDate?: string;

  @IsOptional()
  @IsEnum(['user', 'system', 'ai'])
  generatedBy?: 'user' | 'system' | 'ai';
}

class UpdatePlanDto {
  @IsOptional()
  @IsEnum(['user', 'system', 'ai'])
  generatedBy?: 'user' | 'system' | 'ai';
}

class AddTaskToPlanDto {
  @IsString()
  taskId!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  order?: number;
}

class TaskOrderItem {
  @IsString()
  taskId!: string;

  @IsNumber()
  @Type(() => Number)
  order!: number;
}

class ReorderTasksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskOrderItem)
  tasks!: TaskOrderItem[];
}

@Controller({ path: 'plans', version: '1' })
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get('today')
  getTodayPlan(@CurrentUser() user: AuthenticatedUser) {
    return this.plansService.getTodayPlan(user.userId);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(14), ParseIntPipe) limit: number = 14,
  ) {
    return this.plansService.findAll(user.userId, { cursor, limit });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePlanDto,
  ) {
    return this.plansService.create(user.userId, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.plansService.findOne(user.userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.plansService.update(user.userId, id, dto);
  }

  @Post(':id/tasks')
  @HttpCode(HttpStatus.OK)
  addTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddTaskToPlanDto,
  ) {
    return this.plansService.addTask(user.userId, id, dto);
  }

  @Delete(':id/tasks/:taskId')
  @HttpCode(HttpStatus.OK)
  removeTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.plansService.removeTask(user.userId, id, taskId);
  }

  @Post(':id/tasks/reorder')
  @HttpCode(HttpStatus.OK)
  reorderTasks(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReorderTasksDto,
  ) {
    return this.plansService.reorderTasks(user.userId, id, dto.tasks);
  }
}
