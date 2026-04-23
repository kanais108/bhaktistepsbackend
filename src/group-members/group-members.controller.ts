import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { GroupMembersService } from './group-members.service';
import { CreateGroupMemberDto } from './dto/create-group-member.dto';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
    role: string;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('group-members')
export class GroupMembersController {
  constructor(private readonly groupMembersService: GroupMembersService) {}

  @UseGuards(RolesGuard)
  @Roles('SERVANT_LEADER', 'SECTOR_LEADER', 'CIRCLE_LEADER', 'SUPER_ADMIN')
  @Post()
  create(@Body() dto: CreateGroupMemberDto) {
    return this.groupMembersService.create(dto);
  }

  @Get()
  findAll(@Query('groupId') groupId: string, @Req() req: AuthenticatedRequest) {
    return this.groupMembersService.getMembers(groupId, req.user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles('SERVANT_LEADER', 'SECTOR_LEADER', 'CIRCLE_LEADER', 'SUPER_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.groupMembersService.remove(id, req.user.userId);
  }
}
