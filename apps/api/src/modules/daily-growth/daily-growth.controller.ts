import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
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
