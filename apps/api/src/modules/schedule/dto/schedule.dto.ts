import { IsOptional, IsString, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ProposedTaskDto {
  @IsString()
  id!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  dueAt?: string;

  @IsOptional()
  @IsNumber()
  estimatedMinutes?: number;

  @IsOptional()
  @IsString()
  action?: 'KEEP' | 'MOVE' | 'ADD' | 'REMOVE' | 'DELAY';
}

export class SimulateScheduleDto {
  @IsNumber()
  currentPlanVersion!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProposedTaskDto)
  proposedTasks!: ProposedTaskDto[];

  @IsOptional()
  @IsString()
  targetDate?: string;
}

export class ApplyScheduleAdaptationDto {
  @IsString()
  targetDate!: string; // YYYY-MM-DD

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProposedTaskDto)
  finalTasks!: ProposedTaskDto[];
}
