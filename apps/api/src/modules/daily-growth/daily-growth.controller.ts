import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { DailyGrowthService } from './daily-growth.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@Controller({ path: 'daily-growth', version: '1' })
@UseGuards(JwtAuthGuard)
export class DailyGrowthController {
  constructor(private readonly dailyGrowthService: DailyGrowthService) {}

  @Get('today')
  getToday(@CurrentUser() user: AuthenticatedUser) {
    return this.dailyGrowthService.getToday(user.userId);
  }

  @Post('checkin')
  @HttpCode(HttpStatus.OK)
  checkin(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCheckinDto,
  ) {
    return this.dailyGrowthService.checkin(user.userId, dto);
  }

  /**
   * GET /api/v1/daily-growth/checkins
   * Returns paginated check-in history with optional date range filtering.
   */
  @Get('checkins')
  listCheckins(
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number = 30,
  ) {
    return this.dailyGrowthService.listCheckins(user.userId, { from, to, cursor, limit });
  }

  /**
   * GET /api/v1/daily-growth/checkins/:date
   * Returns check-in for a specific date (YYYY-MM-DD).
   */
  @Get('checkins/:date')
  getCheckin(
    @CurrentUser() user: AuthenticatedUser,
    @Param('date') date: string,
  ) {
    return this.dailyGrowthService.getCheckin(user.userId, date);
  }

  @Get('session')
  getSession(@CurrentUser() user: AuthenticatedUser) {
    return this.dailyGrowthService.getSession(user.userId);
  }

  @Post('session/start')
  @HttpCode(HttpStatus.OK)
  startSession(@CurrentUser() user: AuthenticatedUser) {
    return this.dailyGrowthService.startSession(user.userId);
  }

  @Post('session/complete')
  @HttpCode(HttpStatus.OK)
  completeSession(@CurrentUser() user: AuthenticatedUser) {
    return this.dailyGrowthService.completeSession(user.userId);
  }
}
