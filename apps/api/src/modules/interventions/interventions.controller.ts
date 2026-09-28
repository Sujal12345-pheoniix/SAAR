import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InterventionStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { InterventionsService } from './interventions.service';
import { RejectInterventionDto, CompleteInterventionDto } from './dto/intervention.dto';

@Controller({ path: 'interventions', version: '1' })
@UseGuards(JwtAuthGuard)
export class InterventionsController {
  constructor(private readonly interventionsService: InterventionsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: InterventionStatus,
  ) {
    return this.interventionsService.list(user.userId, status);
  }

  @Get(':id')
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.interventionsService.getById(user.userId, id);
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  generate(@CurrentUser() user: AuthenticatedUser) {
    return this.interventionsService.generateCandidates(user.userId);
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.interventionsService.accept(user.userId, id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RejectInterventionDto,
  ) {
    return this.interventionsService.reject(user.userId, id, dto);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CompleteInterventionDto,
  ) {
    return this.interventionsService.complete(user.userId, id, dto);
  }
}
