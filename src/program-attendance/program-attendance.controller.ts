import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BulkProgramAttendanceDto } from './dto/bulk-program-attendance.dto';
import { CreateProgramSessionDto } from './dto/create-program-session.dto';
import { ProgramAttendanceService } from './program-attendance.service';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
    role: string;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('program-attendance')
export class ProgramAttendanceController {
  constructor(
    private readonly programAttendanceService: ProgramAttendanceService,
  ) {}

  @UseGuards(RolesGuard)
  @Roles('SERVANT_LEADER', 'SECTOR_LEADER', 'CIRCLE_LEADER', 'SUPER_ADMIN')
  @Get('batches')
  getMyBatches(@Req() req: AuthenticatedRequest) {
    return this.programAttendanceService.getMyBatches(req.user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles('SERVANT_LEADER', 'SECTOR_LEADER', 'CIRCLE_LEADER', 'SUPER_ADMIN')
  @Get('batches/:batchId/members')
  getBatchMembers(
    @Param('batchId') batchId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.programAttendanceService.getBatchMembers(
      req.user.userId,
      batchId,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('SERVANT_LEADER', 'SECTOR_LEADER', 'CIRCLE_LEADER', 'SUPER_ADMIN')
  @Get('batches/:batchId/sessions')
  getBatchSessions(
    @Param('batchId') batchId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.programAttendanceService.getBatchSessions(
      req.user.userId,
      batchId,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('SERVANT_LEADER', 'SECTOR_LEADER', 'CIRCLE_LEADER', 'SUPER_ADMIN')
  @Post('sessions')
  createSession(
    @Body() dto: CreateProgramSessionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.programAttendanceService.createSession(req.user.userId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('SERVANT_LEADER', 'SECTOR_LEADER', 'CIRCLE_LEADER', 'SUPER_ADMIN')
  @Get('sessions/:sessionId/attendance')
  getSessionAttendance(
    @Param('sessionId') sessionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.programAttendanceService.getSessionAttendance(
      req.user.userId,
      sessionId,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('SERVANT_LEADER', 'SECTOR_LEADER', 'CIRCLE_LEADER', 'SUPER_ADMIN')
  @Post('bulk')
  saveBulkAttendance(
    @Body() dto: BulkProgramAttendanceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.programAttendanceService.saveBulkAttendance(
      req.user.userId,
      dto,
    );
  }
}
