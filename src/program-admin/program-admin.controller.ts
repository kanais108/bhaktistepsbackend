import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  AddProgramMemberDto,
  CopyMembersFromGroupDto,
  CreateProgramBatchDto,
  CreateProgramDto,
  UpdateProgramBatchDto,
  UpdateProgramDto,
} from './dto/program-admin.dto';
import { ProgramAdminService } from './program-admin.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('program-admin')
export class ProgramAdminController {
  constructor(private readonly programAdminService: ProgramAdminService) {}

  @Get('programs')
  getPrograms() {
    return this.programAdminService.getPrograms();
  }

  @Post('programs')
  createProgram(@Body() dto: CreateProgramDto) {
    return this.programAdminService.createProgram(dto);
  }

  @Patch('programs/:programId')
  updateProgram(
    @Param('programId') programId: string,
    @Body() dto: UpdateProgramDto,
  ) {
    return this.programAdminService.updateProgram(programId, dto);
  }

  @Get('batches')
  getBatches() {
    return this.programAdminService.getBatches();
  }

  @Post('batches')
  createBatch(@Body() dto: CreateProgramBatchDto) {
    return this.programAdminService.createBatch(dto);
  }

  @Patch('batches/:batchId')
  updateBatch(
    @Param('batchId') batchId: string,
    @Body() dto: UpdateProgramBatchDto,
  ) {
    return this.programAdminService.updateBatch(batchId, dto);
  }

  @Get('batches/:batchId/members')
  getBatchMembers(@Param('batchId') batchId: string) {
    return this.programAdminService.getBatchMembers(batchId);
  }

  @Post('batches/:batchId/members')
  addBatchMember(
    @Param('batchId') batchId: string,
    @Body() dto: AddProgramMemberDto,
  ) {
    return this.programAdminService.addBatchMember(batchId, dto);
  }

  @Delete('batches/:batchId/members/:userId')
  deactivateBatchMember(
    @Param('batchId') batchId: string,
    @Param('userId') userId: string,
  ) {
    return this.programAdminService.deactivateBatchMember(batchId, userId);
  }

  @Post('batches/:batchId/copy-members-from-group')
  copyMembersFromGroup(
    @Param('batchId') batchId: string,
    @Body() dto: CopyMembersFromGroupDto,
  ) {
    return this.programAdminService.copyMembersFromGroup(batchId, dto);
  }

  @Get('leaders')
  getLeaders() {
    return this.programAdminService.getLeaders();
  }

  @Get('trees')
  getTrees() {
    return this.programAdminService.getTrees();
  }
}
