import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AttendanceService } from './attendance.service';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
    role: string;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @UseGuards(RolesGuard)
  @Roles('SERVANT_LEADER', 'SECTOR_LEADER', 'CIRCLE_LEADER', 'SUPER_ADMIN')
  @Post()
  create(
    @Body() createAttendanceDto: CreateAttendanceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.attendanceService.create({
      ...createAttendanceDto,
      markedByUserId: req.user.userId,
    });
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.attendanceService.findAllScoped(req.user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles('SERVANT_LEADER', 'SECTOR_LEADER', 'CIRCLE_LEADER', 'SUPER_ADMIN')
  @Post('bulk')
  bulkCreateOrUpdate(
    @Body() bulkAttendanceDto: BulkAttendanceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.attendanceService.bulkCreate({
      eventId: bulkAttendanceDto.eventId,
      markedByUserId: req.user.userId,
      entries: bulkAttendanceDto.records.map((record) => ({
        userId: record.userId,
        status: record.status,
        remarks: record.remarks,
      })),
    });
  }
}
