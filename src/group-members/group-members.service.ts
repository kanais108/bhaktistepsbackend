import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessScopeService } from '../authz/access-scope.service';
import { CreateGroupMemberDto } from './dto/create-group-member.dto';

@Injectable()
export class GroupMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessScopeService: AccessScopeService,
  ) {}

  async create(createGroupMemberDto: CreateGroupMemberDto) {
    try {
      return await this.prisma.groupMember.create({
        data: {
          groupId: createGroupMemberDto.groupId,
          userId: createGroupMemberDto.userId,
        },
        include: {
          group: true,
          user: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('User already exists in this group');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.groupMember.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        group: true,
        user: true,
      },
    });
  }

  async findByGroup(groupId: string) {
    return this.prisma.groupMember.findMany({
      where: { groupId },
      orderBy: {
        user: {
          fullName: 'asc',
        },
      },
      include: {
        user: true,
        group: true,
      },
    });
  }

  async getMembers(groupId: string, viewerUserId: string) {
    const { accessibleUserIds } =
      await this.accessScopeService.getScopedUserIdsAndTree(viewerUserId);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return [];
    }

    const members = await this.prisma.groupMember.findMany({
      where: {
        groupId,
        ...(accessibleUserIds !== null
          ? { userId: { in: accessibleUserIds } }
          : {}),
      },
      orderBy: {
        user: {
          fullName: 'asc',
        },
      },
      include: {
        user: true,
        group: true,
      },
    });

    if (accessibleUserIds !== null && members.length === 0) {
      throw new ForbiddenException('You do not have access to this group');
    }

    return members.map((member) => ({
      id: member.id,
      userId: member.userId,
      groupId: member.groupId,
      joinedAt: member.createdAt,
      fullName: member.user.fullName,
      email: member.user.email,
      phone: member.user.phone,
      role: member.user.role,
    }));
  }

  async remove(groupMemberId: string, viewerUserId: string) {
    const { accessibleUserIds } =
      await this.accessScopeService.getScopedUserIdsAndTree(viewerUserId);

    const member = await this.prisma.groupMember.findUnique({
      where: { id: groupMemberId },
      include: {
        user: true,
        group: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Group member not found');
    }

    if (
      accessibleUserIds !== null &&
      !accessibleUserIds.includes(member.userId)
    ) {
      throw new ForbiddenException(
        'You do not have permission to remove this member',
      );
    }

    return this.prisma.groupMember.delete({
      where: { id: groupMemberId },
      include: {
        user: true,
        group: true,
      },
    });
  }
}
