export class CreateProgramDto {
  name!: string;
  description?: string;
  totalWeeks?: number;
  isActive?: boolean;
}

export class UpdateProgramDto {
  name?: string;
  description?: string;
  totalWeeks?: number;
  isActive?: boolean;
}

export class CreateProgramBatchDto {
  programId!: string;
  leaderId!: string;
  treeId?: string | null;
  name?: string;
  startDate?: string | null;
  isActive?: boolean;
}

export class UpdateProgramBatchDto {
  programId?: string;
  leaderId?: string;
  treeId?: string | null;
  name?: string;
  startDate?: string | null;
  isActive?: boolean;
}

export class AddProgramMemberDto {
  userId!: string;
}

export class CopyMembersFromGroupDto {
  groupId!: string;
}
