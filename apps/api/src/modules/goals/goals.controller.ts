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
import { GoalStatus } from '@prisma/client';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

class CreateMetricDto {
  @IsString()
  metricType!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  targetValue?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  currentValue?: number;

  @IsOptional()
  @IsString()
  unit?: string;
}

class UpdateMetricDto {
  @IsOptional()
  @IsString()
  metricType?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  targetValue?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  currentValue?: number;

  @IsOptional()
  @IsString()
  unit?: string;
}

class RecordObservationDto {
  @IsNumber()
  @Type(() => Number)
  value!: number;

  @IsOptional()
  @IsString()
  observedAt?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  unit?: string;
}

@Controller({ path: 'goals', version: '1' })
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: GoalStatus,
    @Query('lifeAreaId') lifeAreaId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    return this.goalsService.findAll(user.userId, { status, lifeAreaId, cursor, limit });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateGoalDto,
  ) {
    return this.goalsService.create(user.userId, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.goalsService.findOne(user.userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalsService.update(user.userId, id, dto);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.goalsService.archive(user.userId, id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.goalsService.complete(user.userId, id);
  }

  @Post(':id/reopen')
  @HttpCode(HttpStatus.OK)
  reopen(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.goalsService.reopen(user.userId, id);
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  pause(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.goalsService.pause(user.userId, id);
  }

  // ── GoalMetrics ──────────────────────────────────────────────────────────────

  @Post(':goalId/metrics')
  @HttpCode(HttpStatus.CREATED)
  createMetric(
    @CurrentUser() user: AuthenticatedUser,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Body() dto: CreateMetricDto,
  ) {
    return this.goalsService.createMetric(user.userId, goalId, dto);
  }

  @Patch(':goalId/metrics/:metricId')
  updateMetric(
    @CurrentUser() user: AuthenticatedUser,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Param('metricId', ParseUUIDPipe) metricId: string,
    @Body() dto: UpdateMetricDto,
  ) {
    return this.goalsService.updateMetric(user.userId, goalId, metricId, dto);
  }

  @Delete(':goalId/metrics/:metricId')
  @HttpCode(HttpStatus.OK)
  deleteMetric(
    @CurrentUser() user: AuthenticatedUser,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Param('metricId', ParseUUIDPipe) metricId: string,
  ) {
    return this.goalsService.deleteMetric(user.userId, goalId, metricId);
  }

  // ── MetricObservations ───────────────────────────────────────────────────────

  @Post(':goalId/metrics/:metricId/observations')
  @HttpCode(HttpStatus.CREATED)
  recordObservation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Param('metricId', ParseUUIDPipe) metricId: string,
    @Body() dto: RecordObservationDto,
  ) {
    return this.goalsService.recordObservation(user.userId, goalId, metricId, dto);
  }

  @Get(':goalId/metrics/:metricId/observations')
  listObservations(
    @CurrentUser() user: AuthenticatedUser,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Param('metricId', ParseUUIDPipe) metricId: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    return this.goalsService.listObservations(user.userId, goalId, metricId, { cursor, limit });
  }

  @Get(':goalId/metrics/:metricId/observations/latest')
  getLatestObservation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Param('metricId', ParseUUIDPipe) metricId: string,
  ) {
    return this.goalsService.getLatestObservation(user.userId, goalId, metricId);
  }
}
