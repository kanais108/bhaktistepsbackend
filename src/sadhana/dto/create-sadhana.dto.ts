import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSadhanaDto {
  @IsUUID()
  userId: string;

  @IsDateString()
  entryDate: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(64)
  japaRounds?: number;

  @IsOptional()
  @IsBoolean()
  mangalaArati?: boolean;

  @IsOptional()
  @IsBoolean()
  tulasiPuja?: boolean;

  @IsOptional()
  @IsBoolean()
  guruPuja?: boolean;

  @IsOptional()
  @IsBoolean()
  bhagavatamClass?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  readingMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  serviceMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  sleptAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  wokeUpAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
