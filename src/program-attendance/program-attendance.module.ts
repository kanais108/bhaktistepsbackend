import { Module } from '@nestjs/common';
import { ProgramAttendanceController } from './program-attendance.controller';
import { ProgramAttendanceService } from './program-attendance.service';

@Module({
  controllers: [ProgramAttendanceController],
  providers: [ProgramAttendanceService],
})
export class ProgramAttendanceModule {}
