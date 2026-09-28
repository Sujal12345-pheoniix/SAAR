import { IsOptional, IsString, IsNumber, IsObject } from 'class-validator';

export class RejectInterventionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CompleteInterventionDto {
  @IsOptional()
  @IsNumber()
  postValue?: number;

  @IsOptional()
  @IsObject()
  outcomeData?: Record<string, unknown>;
}
