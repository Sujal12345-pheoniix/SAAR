import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { BehaviorEventsService } from './behavior-events.service';

@Controller({ path: 'behavior-events', version: '1' })
@UseGuards(JwtAuthGuard)
export class BehaviorEventsController {
  constructor(private readonly behaviorEventsService: BehaviorEventsService) {}

  /**
   * GET /api/v1/behavior-events
   * Returns paginated behavior events for the current user.
   * Supports filtering by eventType and date range.
   */
  @Get()
  getEvents(
    @CurrentUser() user: AuthenticatedUser,
    @Query('eventType') eventType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
  ) {
    return this.behaviorEventsService.getEvents(user.userId, {
      eventType,
      from,
      to,
      cursor,
      limit,
    });
  }
}
