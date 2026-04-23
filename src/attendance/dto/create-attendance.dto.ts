import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAttendanceDto {
  @IsUUID()
  eventId: string;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  status?: string;
}
