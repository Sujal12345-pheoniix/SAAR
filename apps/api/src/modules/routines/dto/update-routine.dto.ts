import {
  IsString,
  IsOptional,
  IsBoolean,
  Matches,
} from 'class-validator';

export class UpdateRoutineDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  recurrenceRule?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'preferredTime must be in HH:MM format',
  })
  preferredTime?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
