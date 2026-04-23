import { IsOptional, IsUUID } from 'class-validator';

export class UpdateUserHierarchyDto {
  @IsOptional()
  @IsUUID()
  reportsToUserId?: string | null;

  @IsOptional()
  @IsUUID()
  treeId?: string | null;
}
