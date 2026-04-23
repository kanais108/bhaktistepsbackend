import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateGroupDto {
  @IsUUID()
  templeId: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  groupType?: string;
}
