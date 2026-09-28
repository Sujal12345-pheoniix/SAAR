import { IsString, IsOptional, IsNumber, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLifeAreaDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  title?: string;

  /**
   * Alias for title sent by web frontend form
   */
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * UI Accent color hex
   */
  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  targetState?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weight?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}

