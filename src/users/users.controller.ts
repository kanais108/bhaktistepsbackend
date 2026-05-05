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

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Public mobile registration endpoint.
   * User does not have JWT token yet, so this must remain public.
   */
  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * Protected admin/leader user creation endpoint.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CIRCLE_LEADER', 'SUPER_ADMIN')
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: string,
  ) {
    return this.usersService.findAllScopedPaginated({
      viewerUserId: req.user.userId,
      search,
      page: Number(page),
      limit: Number(limit),
      role,
      isActive: isActive === undefined ? undefined : isActive === 'true',
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('by-email')
  async findByEmail(@Query('email') email: string) {
    if (!email || !email.trim()) {
      throw new BadRequestException('email is required');
    }

    return this.usersService.findByEmail(email);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CIRCLE_LEADER', 'SUPER_ADMIN')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.update(req.user.userId, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CIRCLE_LEADER', 'SUPER_ADMIN')
  @Patch(':id/role')
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.updateRole(req.user.userId, id, dto.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CIRCLE_LEADER', 'SUPER_ADMIN')
  @Patch(':id/hierarchy')
  updateHierarchy(
    @Param('id') id: string,
    @Body() dto: UpdateUserHierarchyDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.updateHierarchy(req.user.userId, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
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
