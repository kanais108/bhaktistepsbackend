import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
    role: string;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @UseGuards(RolesGuard)
  @Roles('SECTOR_LEADER', 'CIRCLE_LEADER', 'SUPER_ADMIN')
  @Post()
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.groupsService.findAllScoped(req.user.userId);
  }
}
