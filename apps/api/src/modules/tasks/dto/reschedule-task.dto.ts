import { IsNotEmpty, IsDateString, IsOptional, IsString } from 'class-validator';

export class RescheduleTaskDto {
  @IsNotEmpty()
  @IsDateString()
  dueAt!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
