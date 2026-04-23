import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserHierarchyDto } from './dto/update-user-hierarchy.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
    role: string;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(RolesGuard)
  @Roles('CIRCLE_LEADER', 'SUPER_ADMIN')
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query('search') search?: string) {
    return this.usersService.findAllScoped(req.user.userId, search);
  }

  @Get('by-email')
  async findByEmail(@Query('email') email: string) {
    if (!email || !email.trim()) {
      throw new BadRequestException('email is required');
    }

    return this.usersService.findByEmail(email);
  }

  @UseGuards(RolesGuard)
  @Roles('CIRCLE_LEADER', 'SUPER_ADMIN')
  @Get('assignable-managers')
  getAssignableManagers(
    @Query('role') role: UserRole,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!role) {
      throw new BadRequestException('role is required');
    }

    if (!Object.values(UserRole).includes(role)) {
      throw new BadRequestException('Invalid role');
    }

    return this.usersService.getAssignableManagers(req.user.userId, role);
  }

  @UseGuards(RolesGuard)
  @Roles('CIRCLE_LEADER', 'SUPER_ADMIN')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.update(req.user.userId, id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('CIRCLE_LEADER', 'SUPER_ADMIN')
  @Patch(':id/role')
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.updateRole(req.user.userId, id, dto.role);
  }

  @UseGuards(RolesGuard)
  @Roles('CIRCLE_LEADER', 'SUPER_ADMIN')
  @Patch(':id/hierarchy')
  updateHierarchy(
    @Param('id') id: string,
    @Body() dto: UpdateUserHierarchyDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.updateHierarchy(req.user.userId, id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('CIRCLE_LEADER', 'SUPER_ADMIN')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.updateStatus(req.user.userId, id, dto.isActive);
  }
}
