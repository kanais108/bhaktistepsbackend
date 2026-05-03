import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum EventModeDto {
  offline = 'offline',
  online = 'online',
  hybrid = 'hybrid',
}

export enum AttendanceModeDto {
  qr = 'qr',
  self = 'self',
  admin = 'admin',
  code = 'code',
}

export enum EventCategoryDto {
  bhakti_vriksha = 'bhakti_vriksha',
  bhagavatam_class = 'bhagavatam_class',
  mangala_arati = 'mangala_arati',
  sunday_feast = 'sunday_feast',
  festival = 'festival',
  youth_program = 'youth_program',
  course = 'course',
  other = 'other',
}

export class CreateEventDto {
  @IsUUID()
  templeId: string;

  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsEnum(EventCategoryDto)
  category: EventCategoryDto;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(EventModeDto)
  eventMode?: EventModeDto;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  locationName?: string;

  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;

  @IsOptional()
  @IsEnum(AttendanceModeDto)
  attendanceMode?: AttendanceModeDto;

  @IsOptional()
  @IsString()
  posterImageUrl?: string;
}
