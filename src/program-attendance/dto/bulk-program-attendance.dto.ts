export class BulkProgramAttendanceRecordDto {
  userId!: string;
  status!: string;
  remarks?: string;
}

export class BulkProgramAttendanceDto {
  sessionId!: string;
  records!: BulkProgramAttendanceRecordDto[];
}
