import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  IsBoolean,
} from 'class-validator';

export enum UpdateEventModeDto {
  offline = 'offline',
  online = 'online',
  hybrid = 'hybrid',
}

export enum UpdateAttendanceModeDto {
  qr = 'qr',
  self = 'self',
  admin = 'admin',
  code = 'code',
}

export enum UpdateEventCategoryDto {
  bhakti_vriksha = 'bhakti_vriksha',
  bhagavatam_class = 'bhagavatam_class',
  mangala_arati = 'mangala_arati',
  sunday_feast = 'sunday_feast',
  festival = 'festival',
  youth_program = 'youth_program',
  course = 'course',
  other = 'other',
}

export class UpdateEventDto {
  @IsOptional()
  @IsUUID()
  templeId?: string;

  @IsOptional()
  @IsUUID()
  groupId?: string | null;

  @IsOptional()
  @IsEnum(UpdateEventCategoryDto)
  category?: UpdateEventCategoryDto;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsEnum(UpdateEventModeDto)
  eventMode?: UpdateEventModeDto;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  locationName?: string | null;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsEnum(UpdateAttendanceModeDto)
  attendanceMode?: UpdateAttendanceModeDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
