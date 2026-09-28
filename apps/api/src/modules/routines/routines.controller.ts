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
import { RoutineOccurrenceStatus } from '@prisma/client';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { RoutinesService } from './routines.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';

class SkipOccurrenceDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

class CompleteOccurrenceDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  actualDuration?: number;
}

class CreateOccurrenceDto {
  @IsString()
  localDate!: string;
}

@Controller({ path: 'routines', version: '1' })
@UseGuards(JwtAuthGuard)
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.routinesService.findAll(user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRoutineDto,
  ) {
    return this.routinesService.create(user.userId, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.routinesService.findOne(user.userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoutineDto,
  ) {
    return this.routinesService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.routinesService.remove(user.userId, id);
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  pause(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.routinesService.pause(user.userId, id);
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  resume(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.routinesService.resume(user.userId, id);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.routinesService.archive(user.userId, id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.routinesService.complete(user.userId, id);
  }

  @Post(':id/skip')
  @HttpCode(HttpStatus.OK)
  skip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.routinesService.skip(user.userId, id);
  }

  // ── RoutineOccurrences ────────────────────────────────────────────────────────

  @Get(':routineId/occurrences')
  getOccurrences(
    @CurrentUser() user: AuthenticatedUser,
    @Param('routineId', ParseUUIDPipe) routineId: string,
    @Query('date') date?: string,
    @Query('status') status?: RoutineOccurrenceStatus,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number = 30,
  ) {
    return this.routinesService.getOccurrences(user.userId, routineId, { date, status, limit });
  }

  @Post(':routineId/occurrences')
  @HttpCode(HttpStatus.CREATED)
  createOccurrence(
    @CurrentUser() user: AuthenticatedUser,
    @Param('routineId', ParseUUIDPipe) routineId: string,
    @Body() dto: CreateOccurrenceDto,
  ) {
    return this.routinesService.getOrCreateOccurrence(user.userId, routineId, dto.localDate);
  }

  @Post(':routineId/occurrences/:occurrenceId/complete')
  @HttpCode(HttpStatus.OK)
  completeOccurrence(
    @CurrentUser() user: AuthenticatedUser,
    @Param('routineId', ParseUUIDPipe) routineId: string,
    @Param('occurrenceId', ParseUUIDPipe) occurrenceId: string,
    @Body() dto: CompleteOccurrenceDto,
  ) {
    return this.routinesService.completeOccurrence(user.userId, routineId, occurrenceId, dto);
  }

  @Post(':routineId/occurrences/:occurrenceId/skip')
  @HttpCode(HttpStatus.OK)
  skipOccurrence(
    @CurrentUser() user: AuthenticatedUser,
    @Param('routineId', ParseUUIDPipe) routineId: string,
    @Param('occurrenceId', ParseUUIDPipe) occurrenceId: string,
    @Body() dto: SkipOccurrenceDto,
  ) {
    return this.routinesService.skipOccurrence(user.userId, routineId, occurrenceId, dto.reason);
  }

  @Post(':routineId/occurrences/:occurrenceId/miss')
  @HttpCode(HttpStatus.OK)
  markOccurrenceMissed(
    @CurrentUser() user: AuthenticatedUser,
    @Param('routineId', ParseUUIDPipe) routineId: string,
    @Param('occurrenceId', ParseUUIDPipe) occurrenceId: string,
  ) {
    return this.routinesService.markOccurrenceMissed(user.userId, routineId, occurrenceId);
  }
}
