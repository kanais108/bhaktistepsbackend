import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BulkAttendanceRecordDto {
  @IsUUID()
  userId: string;

  @IsString()
  @MaxLength(30)
  status: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BulkAttendanceDto {
  @IsUUID()
  eventId: string;

  @IsUUID()
  groupId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceRecordDto)
  records: BulkAttendanceRecordDto[];
}
