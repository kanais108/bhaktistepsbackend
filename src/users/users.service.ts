import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AccessScopeService } from '../authz/access-scope.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessScopeService: AccessScopeService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const normalizedPhone =
      createUserDto.phone && createUserDto.phone.trim() !== ''
        ? createUserDto.phone.trim()
        : null;

    try {
      return await this.prisma.user.create({
        data: {
          fullName: createUserDto.fullName.trim(),
          email: createUserDto.email.trim().toLowerCase(),
          phone: normalizedPhone,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'User with this email or phone already exists',
        );
      }
      throw error;
    }
  }

  async findAllScoped(viewerUserId: string, search?: string) {
    const { accessibleUserIds } =
      await this.accessScopeService.getScopedUserIdsAndTree(viewerUserId);

    const trimmedSearch = search?.trim();

    const searchWhere: Prisma.UserWhereInput | undefined = trimmedSearch
      ? {
          OR: [
            {
              fullName: {
                contains: trimmedSearch,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: trimmedSearch,
                mode: 'insensitive',
              },
            },
            {
              phone: {
                contains: trimmedSearch,
                mode: 'insensitive',
              },
            },
          ],
        }
      : undefined;

    const where: Prisma.UserWhereInput =
      accessibleUserIds === null
        ? {
            ...(searchWhere ?? {}),
          }
        : {
            id: { in: accessibleUserIds },
            ...(searchWhere ?? {}),
          };

    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(viewerUserId: string, userId: string, dto: UpdateUserDto) {
    const { user, currentUser } = await this.getManageableUserOrThrow(
      viewerUserId,
      userId,
    );

    if (dto.role !== undefined) {
      this.assertCanAssignRole(currentUser.role, dto.role);

      const existingManager = dto.reportsToUserId
        ? await this.prisma.user.findUnique({
            where: { id: dto.reportsToUserId },
          })
        : user.reportsToUserId
          ? await this.prisma.user.findUnique({
              where: { id: user.reportsToUserId },
            })
          : null;

      if (existingManager) {
        this.assertManagerRoleAllowedForTargetRole(dto.role, existingManager);
      }
    }

    if (dto.treeId !== undefined && dto.treeId !== null) {
      this.assertTreeAssignmentAllowed(currentUser, dto.treeId);
    }

    if (dto.reportsToUserId !== undefined && dto.reportsToUserId !== null) {
      const manager = await this.prisma.user.findUnique({
        where: { id: dto.reportsToUserId },
      });

      if (!manager) {
        throw new NotFoundException('Reporting user not found');
      }

      await this.assertCanAssignManager(
        viewerUserId,
        userId,
        dto.role ?? user.role,
        dto.treeId !== undefined ? dto.treeId : user.treeId,
        manager,
      );
    }

    if (
      dto.isActive !== undefined &&
      dto.isActive === false &&
      user.id === viewerUserId
    ) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        role: dto.role ?? user.role,
        reportsToUserId:
          dto.reportsToUserId !== undefined
            ? dto.reportsToUserId
            : user.reportsToUserId,
        treeId: dto.treeId !== undefined ? dto.treeId : user.treeId,
        isActive: dto.isActive !== undefined ? dto.isActive : user.isActive,
      },
    });
  }

  async updateRole(viewerUserId: string, userId: string, role: UserRole) {
    const { user, currentUser } = await this.getManageableUserOrThrow(
      viewerUserId,
      userId,
    );

    this.assertCanAssignRole(currentUser.role, role);

    if (user.reportsToUserId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: user.reportsToUserId },
      });

      if (manager) {
        this.assertManagerRoleAllowedForTargetRole(role, manager);
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  async updateHierarchy(
    viewerUserId: string,
    userId: string,
    data: {
      treeId?: string | null;
      reportsToUserId?: string | null;
    },
  ) {
    const { user, currentUser } = await this.getManageableUserOrThrow(
      viewerUserId,
      userId,
    );

    const nextTreeId = data.treeId !== undefined ? data.treeId : user.treeId;
    const nextReportsToUserId =
      data.reportsToUserId !== undefined
        ? data.reportsToUserId
        : user.reportsToUserId;

    if (nextTreeId !== undefined && nextTreeId !== null) {
      this.assertTreeAssignmentAllowed(currentUser, nextTreeId);
    }

    if (nextReportsToUserId !== undefined && nextReportsToUserId !== null) {
      if (nextReportsToUserId === userId) {
        throw new BadRequestException('User cannot report to themselves');
      }

      const manager = await this.prisma.user.findUnique({
        where: { id: nextReportsToUserId },
      });

      if (!manager) {
        throw new NotFoundException('Reporting user not found');
      }

      await this.assertCanAssignManager(
        viewerUserId,
        userId,
        user.role,
        nextTreeId,
        manager,
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        treeId: nextTreeId,
        reportsToUserId: nextReportsToUserId,
      },
    });
  }

  async updateStatus(viewerUserId: string, userId: string, isActive: boolean) {
    const { user } = await this.getManageableUserOrThrow(viewerUserId, userId);

    if (!isActive && user.id === viewerUserId) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
  }

  async getAssignableManagers(viewerUserId: string, targetRole: UserRole) {
    const { accessibleUserIds, currentUser } =
      await this.accessScopeService.getScopedUserIdsAndTree(viewerUserId);

    const allowedManagerRoles =
      this.getAllowedManagerRolesForTargetRole(targetRole);

    if (allowedManagerRoles.length === 0) {
      return [];
    }

    const where: Prisma.UserWhereInput = {
      isActive: true,
      role: { in: allowedManagerRoles },
      ...(accessibleUserIds === null
        ? {}
        : {
            id: { in: accessibleUserIds },
          }),
      ...(currentUser.role === UserRole.SUPER_ADMIN || !currentUser.treeId
        ? {}
        : {
            treeId: currentUser.treeId,
          }),
    };

    const managers = await this.prisma.user.findMany({
      where,
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        treeId: true,
        reportsToUserId: true,
      },
    });

    return managers;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email: {
          equals: email.trim(),
          mode: 'insensitive',
        },
        isActive: true,
      },
    });
  }

  private async getManageableUserOrThrow(viewerUserId: string, userId: string) {
    const { accessibleUserIds, currentUser } =
      await this.accessScopeService.getScopedUserIdsAndTree(viewerUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (accessibleUserIds !== null && !accessibleUserIds.includes(user.id)) {
      throw new ForbiddenException(
        'You do not have permission to manage this user',
      );
    }

    return { user, currentUser, accessibleUserIds };
  }

  private assertCanAssignRole(actorRole: UserRole, nextRole: UserRole) {
    const allowedRoles = this.getAssignableRolesForActor(actorRole);

    if (!allowedRoles.includes(nextRole)) {
      throw new ForbiddenException(`You cannot assign the role ${nextRole}`);
    }
  }

  private getAssignableRolesForActor(actorRole: UserRole): UserRole[] {
    switch (actorRole) {
      case UserRole.SUPER_ADMIN:
        return [
          UserRole.SUPER_ADMIN,
          UserRole.CIRCLE_LEADER,
          UserRole.SECTOR_LEADER,
          UserRole.SERVANT_LEADER,
          UserRole.DEVOTEE,
        ];
      case UserRole.CIRCLE_LEADER:
        return [
          UserRole.SECTOR_LEADER,
          UserRole.SERVANT_LEADER,
          UserRole.DEVOTEE,
        ];
      default:
        return [];
    }
  }

  private getAllowedManagerRolesForTargetRole(
    targetRole: UserRole,
  ): UserRole[] {
    switch (targetRole) {
      case UserRole.CIRCLE_LEADER:
        return [UserRole.SUPER_ADMIN];
      case UserRole.SECTOR_LEADER:
        return [UserRole.CIRCLE_LEADER, UserRole.SUPER_ADMIN];
      case UserRole.SERVANT_LEADER:
        return [
          UserRole.SECTOR_LEADER,
          UserRole.CIRCLE_LEADER,
          UserRole.SUPER_ADMIN,
        ];
      case UserRole.DEVOTEE:
        return [
          UserRole.SERVANT_LEADER,
          UserRole.SECTOR_LEADER,
          UserRole.CIRCLE_LEADER,
          UserRole.SUPER_ADMIN,
        ];
      case UserRole.SUPER_ADMIN:
      default:
        return [];
    }
  }

  private assertManagerRoleAllowedForTargetRole(
    targetRole: UserRole,
    manager: User,
  ) {
    const allowedManagerRoles =
      this.getAllowedManagerRolesForTargetRole(targetRole);

    if (allowedManagerRoles.length === 0) {
      throw new BadRequestException(
        `Role ${targetRole} cannot have a reporting manager`,
      );
    }

    if (!allowedManagerRoles.includes(manager.role)) {
      throw new BadRequestException(
        `A user with role ${targetRole} cannot report to a ${manager.role}`,
      );
    }
  }

  private assertTreeAssignmentAllowed(currentUser: User, treeId: string) {
    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      currentUser.treeId &&
      currentUser.treeId !== treeId
    ) {
      throw new ForbiddenException(
        'You cannot assign a user to another leadership tree',
      );
    }
  }

  async findAllScopedPaginated(params: {
    viewerUserId: string;
    search?: string;
    page: number;
    limit: number;
    role?: UserRole;
    isActive?: boolean;
  }) {
    const { viewerUserId, search, page, limit, role, isActive } = params;

    // 👇 reuse your existing method
    const scopedUsers = await this.findAllScoped(viewerUserId, search);

    let filtered = scopedUsers;

    if (role) {
      filtered = filtered.filter((u) => u.role === role);
    }

    if (isActive !== undefined) {
      filtered = filtered.filter((u) => u.isActive === isActive);
    }

    const total = filtered.length;

    const start = (page - 1) * limit;
    const end = start + limit;

    const data = filtered.slice(start, end);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  private async assertCanAssignManager(
    viewerUserId: string,
    targetUserId: string,
    targetRole: UserRole,
    effectiveTreeId: string | null,
    manager: User,
  ) {
    if (manager.id === targetUserId) {
      throw new BadRequestException('User cannot report to themselves');
    }

    const { accessibleUserIds, currentUser } =
      await this.accessScopeService.getScopedUserIdsAndTree(viewerUserId);

    if (accessibleUserIds !== null && !accessibleUserIds.includes(manager.id)) {
      throw new ForbiddenException(
        'You do not have permission to assign this reporting user',
      );
    }

    this.assertManagerRoleAllowedForTargetRole(targetRole, manager);

    if (
      effectiveTreeId &&
      manager.treeId &&
      manager.treeId !== effectiveTreeId
    ) {
      throw new BadRequestException(
        'Reporting user must belong to the same leadership tree',
      );
    }

    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      currentUser.treeId &&
      manager.treeId &&
      manager.treeId !== currentUser.treeId
    ) {
      throw new ForbiddenException(
        'You cannot assign a reporting user from another leadership tree',
      );
    }
  }
}
