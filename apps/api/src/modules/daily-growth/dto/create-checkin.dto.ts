import {
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateCheckinDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'localDate must be in YYYY-MM-DD format',
  })
  localDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  mood?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  energy?: number;

  @IsOptional()
  @IsString()
  reflection?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  dayRating?: number;
}
