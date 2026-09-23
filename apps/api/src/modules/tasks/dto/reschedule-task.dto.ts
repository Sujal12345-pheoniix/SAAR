import { IsNotEmpty, IsDateString } from 'class-validator';

export class RescheduleTaskDto {
  @IsNotEmpty()
  @IsDateString()
  dueAt!: string;
}
