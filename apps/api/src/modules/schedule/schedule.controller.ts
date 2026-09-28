import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ScheduleService } from './schedule.service';
import { SimulateScheduleDto, ApplyScheduleAdaptationDto } from './dto/schedule.dto';

@Controller({ path: 'schedule', version: '1' })
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('candidates')
  getCandidates(
    @CurrentUser() user: AuthenticatedUser,
    @Query('targetDate') targetDate?: string,
  ) {
    return this.scheduleService.getCandidates(user.userId, targetDate);
  }

  @Post('simulate')
  @HttpCode(HttpStatus.OK)
  simulate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SimulateScheduleDto,
  ) {
    return this.scheduleService.simulate(user.userId, dto);
  }

  @Post('apply')
  @HttpCode(HttpStatus.OK)
  apply(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApplyScheduleAdaptationDto,
  ) {
    return this.scheduleService.apply(user.userId, dto);
  }
}
