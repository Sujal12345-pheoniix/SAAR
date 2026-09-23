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
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { LifeAreasService } from './life-areas.service';
import { CreateLifeAreaDto } from './dto/create-life-area.dto';
import { UpdateLifeAreaDto } from './dto/update-life-area.dto';

@Controller({ path: 'life-areas', version: '1' })
@UseGuards(JwtAuthGuard)
export class LifeAreasController {
  constructor(private readonly lifeAreasService: LifeAreasService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.lifeAreasService.findAll(user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLifeAreaDto,
  ) {
    return this.lifeAreasService.create(user.userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLifeAreaDto,
  ) {
    return this.lifeAreasService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.lifeAreasService.remove(user.userId, id);
  }
}
