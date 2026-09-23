import {
  Controller,
  Get,
  Put,
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
import { FutureSelfService } from './future-self.service';
import { UpsertFutureSelfDto } from './dto/upsert-future-self.dto';

@Controller({ path: 'future-self', version: '1' })
@UseGuards(JwtAuthGuard)
export class FutureSelfController {
  constructor(private readonly futureSelfService: FutureSelfService) {}

  @Get()
  getFutureSelf(@CurrentUser() user: AuthenticatedUser) {
    return this.futureSelfService.getFutureSelf(user.userId);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  upsertFutureSelf(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertFutureSelfDto,
  ) {
    return this.futureSelfService.upsertFutureSelf(user.userId, dto);
  }
}
