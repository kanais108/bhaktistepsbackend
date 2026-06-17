export class CreateProgramSessionDto {
  batchId!: string;
  weekNumber!: number;
  sessionDate!: string;
  title?: string;
  notes?: string;
}
