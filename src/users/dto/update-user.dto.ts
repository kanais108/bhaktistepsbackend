import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsUUID()
  reportsToUserId?: string | null;

  @IsOptional()
  @IsUUID()
  treeId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
