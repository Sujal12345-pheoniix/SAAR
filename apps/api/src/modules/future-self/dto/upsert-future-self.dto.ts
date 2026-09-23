import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsObject,
  IsArray,
} from 'class-validator';

export class UpsertFutureSelfDto {
  @IsString()
  @IsNotEmpty()
  futureIdentity!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  horizonYears?: number;

  @IsOptional()
  @IsObject()
  desiredStates?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  priorities?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  values?: string[];

  @IsOptional()
  @IsObject()
  lifeAreaTargets?: Record<string, string>;
}
