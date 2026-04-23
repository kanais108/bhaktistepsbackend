import { IsUUID } from 'class-validator';

export class CreateGroupMemberDto {
  @IsUUID()
  groupId: string;

  @IsUUID()
  userId: string;
}
