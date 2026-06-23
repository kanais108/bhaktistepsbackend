import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  AddProgramMemberDto,
  CopyMembersFromGroupDto,
  CreateProgramBatchDto,
  CreateProgramDto,
  UpdateProgramBatchDto,
  UpdateProgramDto,
} from './dto/program-admin.dto';

@Injectable()
export class ProgramAdminService {
  constructor(private readonly prisma: PrismaService) {}

  getPrograms() {
    return this.prisma.program.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            batches: true,
          },
        },
      },
    });
  }

  async createProgram(dto: CreateProgramDto) {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new BadRequestException('Program name is required');
    }

    try {
      return await this.prisma.program.create({
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          totalWeeks: dto.totalWeeks ?? null,
          isActive: dto.isActive ?? true,
        },
      });
    } catch (error) {
      this.handleUniqueError(error, 'Program already exists');
      throw error;
    }
  }

  async updateProgram(programId: string, dto: UpdateProgramDto) {
    await this.getProgramOrThrow(programId);

    try {
      return await this.prisma.program.update({
        where: {
          id: programId,
        },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
          ...(dto.totalWeeks !== undefined
            ? { totalWeeks: dto.totalWeeks }
            : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });
    } catch (error) {
      this.handleUniqueError(error, 'Program already exists');
      throw error;
    }
  }

  getBatches() {
    return this.prisma.programBatch.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        program: true,
        group: true,
        leader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        tree: true,
        _count: {
          select: {
            members: true,
            sessions: true,
          },
        },
      },
    });
  }

  async createBatch(dto: CreateProgramBatchDto) {
    const program = await this.getProgramOrThrow(dto.programId);
    await this.getLeaderOrThrow(dto.leaderId);

    if (dto.treeId) {
      await this.getTreeOrThrow(dto.treeId);
    }

    const batchName = dto.name?.trim() || program.name;
    const group = await this.createOrFindGroupForBatch(batchName);

    return this.prisma.programBatch.create({
      data: {
        programId: dto.programId,
        leaderId: dto.leaderId,
        treeId: dto.treeId || null,
        groupId: group.id,
        name: batchName,
        startDate: dto.startDate
          ? new Date(`${dto.startDate}T00:00:00.000Z`)
          : null,
        isActive: dto.isActive ?? true,
      },
      include: {
        program: true,
        group: true,
        leader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        tree: true,
        _count: {
          select: {
            members: true,
            sessions: true,
          },
        },
      },
    });
  }

  async updateBatch(batchId: string, dto: UpdateProgramBatchDto) {
    const existingBatch = await this.getBatchOrThrow(batchId);

    if (dto.programId) {
      await this.getProgramOrThrow(dto.programId);
    }

    if (dto.leaderId) {
      await this.getLeaderOrThrow(dto.leaderId);
    }

    if (dto.treeId) {
      await this.getTreeOrThrow(dto.treeId);
    }

    let groupId = existingBatch.groupId;

    if (dto.name !== undefined) {
      const batchName = dto.name?.trim();

      if (batchName && batchName.length > 0) {
        if (groupId) {
          await this.prisma.group.update({
            where: {
              id: groupId,
            },
            data: {
              name: batchName,
              code: this.groupCodeFromName(batchName),
              groupType: 'bhakti_steps',
              isActive: dto.isActive ?? existingBatch.isActive,
            },
          });
        } else {
          const group = await this.createOrFindGroupForBatch(batchName);
          groupId = group.id;
        }
      }
    }

    return this.prisma.programBatch.update({
      where: {
        id: batchId,
      },
      data: {
        ...(dto.programId !== undefined ? { programId: dto.programId } : {}),
        ...(dto.leaderId !== undefined ? { leaderId: dto.leaderId } : {}),
        ...(dto.treeId !== undefined ? { treeId: dto.treeId || null } : {}),
        ...(groupId !== existingBatch.groupId ? { groupId } : {}),
        ...(dto.name !== undefined ? { name: dto.name?.trim() || null } : {}),
        ...(dto.startDate !== undefined
          ? {
              startDate: dto.startDate
                ? new Date(`${dto.startDate}T00:00:00.000Z`)
                : null,
            }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: {
        program: true,
        group: true,
        leader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        tree: true,
        _count: {
          select: {
            members: true,
            sessions: true,
          },
        },
      },
    });
  }

  async getBatchMembers(batchId: string) {
    await this.getBatchOrThrow(batchId);

    return this.prisma.programMember.findMany({
      where: {
        batchId,
      },
      orderBy: {
        joinedAt: 'asc',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });
  }

  async addBatchMember(batchId: string, dto: AddProgramMemberDto) {
    await this.getBatchOrThrow(batchId);
    await this.getActiveUserOrThrow(dto.userId);

    const member = await this.prisma.programMember.upsert({
      where: {
        batchId_userId: {
          batchId,
          userId: dto.userId,
        },
      },
      update: {
        isActive: true,
      },
      create: {
        batchId,
        userId: dto.userId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    await this.syncProgramMemberToGroup(batchId, dto.userId);

    return member;
  }

  async deactivateBatchMember(batchId: string, userId: string) {
    const batch = await this.getBatchOrThrow(batchId);
    await this.getActiveUserOrThrow(userId);

    const result = await this.prisma.programMember.updateMany({
      where: {
        batchId,
        userId,
      },
      data: {
        isActive: false,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Program member not found');
    }

    if (batch.groupId) {
      await this.prisma.groupMember.deleteMany({
        where: {
          groupId: batch.groupId,
          userId,
        },
      });
    }

    return {
      success: true,
      message: 'Program member removed from active batch and linked group',
    };
  }

  async copyMembersFromGroup(batchId: string, dto: CopyMembersFromGroupDto) {
    await this.getBatchOrThrow(batchId);

    const group = await this.prisma.group.findUnique({
      where: {
        id: dto.groupId,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const groupMembers = await this.prisma.groupMember.findMany({
      where: {
        groupId: dto.groupId,
      },
      include: {
        user: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });

    const activeUserIds = groupMembers
      .filter((member) => member.user.isActive)
      .map((member) => member.user.id);

    const results = await this.prisma.$transaction(
      activeUserIds.map((userId) =>
        this.prisma.programMember.upsert({
          where: {
            batchId_userId: {
              batchId,
              userId,
            },
          },
          update: {
            isActive: true,
          },
          create: {
            batchId,
            userId,
            isActive: true,
          },
        }),
      ),
    );

    for (const userId of activeUserIds) {
      await this.syncProgramMemberToGroup(batchId, userId);
    }

    return {
      success: true,
      copiedCount: results.length,
      message: `${results.length} members copied to program batch and linked group`,
    };
  }

  getLeaders() {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          in: [
            UserRole.SERVANT_LEADER,
            UserRole.SECTOR_LEADER,
            UserRole.CIRCLE_LEADER,
            UserRole.SUPER_ADMIN,
          ],
        },
      },
      orderBy: {
        fullName: 'asc',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        treeId: true,
      },
    });
  }

  getTrees() {
    return this.prisma.leadershipTree.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  private async getProgramOrThrow(programId: string) {
    const program = await this.prisma.program.findUnique({
      where: {
        id: programId,
      },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    return program;
  }

  private async getBatchOrThrow(batchId: string) {
    const batch = await this.prisma.programBatch.findUnique({
      where: {
        id: batchId,
      },
    });

    if (!batch) {
      throw new NotFoundException('Program batch not found');
    }

    return batch;
  }

  private async getLeaderOrThrow(leaderId: string) {
    const leader = await this.prisma.user.findUnique({
      where: {
        id: leaderId,
      },
    });

    if (!leader || !leader.isActive) {
      throw new NotFoundException('Leader not found');
    }

    const allowedRoles: UserRole[] = [
      UserRole.SERVANT_LEADER,
      UserRole.SECTOR_LEADER,
      UserRole.CIRCLE_LEADER,
      UserRole.SUPER_ADMIN,
    ];

    if (!allowedRoles.includes(leader.role)) {
      throw new BadRequestException('Selected user is not a leader');
    }

    return leader;
  }

  private async getActiveUserOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.isActive) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async getTreeOrThrow(treeId: string) {
    const tree = await this.prisma.leadershipTree.findUnique({
      where: {
        id: treeId,
      },
    });

    if (!tree) {
      throw new NotFoundException('Leadership tree not found');
    }

    return tree;
  }

  private async getDefaultTempleOrThrow() {
    const temple = await this.prisma.temple.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!temple) {
      throw new BadRequestException('No active temple found');
    }

    return temple;
  }

  private groupCodeFromName(name: string) {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 50);
  }

  private async createOrFindGroupForBatch(groupName: string) {
    const temple = await this.getDefaultTempleOrThrow();

    return this.prisma.group.upsert({
      where: {
        templeId_name: {
          templeId: temple.id,
          name: groupName,
        },
      },
      update: {
        isActive: true,
        groupType: 'bhakti_steps',
      },
      create: {
        templeId: temple.id,
        name: groupName,
        code: this.groupCodeFromName(groupName),
        groupType: 'bhakti_steps',
        isActive: true,
      },
    });
  }

  private async syncProgramMemberToGroup(batchId: string, userId: string) {
    const batch = await this.prisma.programBatch.findUnique({
      where: {
        id: batchId,
      },
      select: {
        groupId: true,
      },
    });

    if (!batch?.groupId) {
      return;
    }

    await this.prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId: batch.groupId,
          userId,
        },
      },
      update: {},
      create: {
        groupId: batch.groupId,
        userId,
      },
    });
  }
  private handleUniqueError(error: unknown, message: string) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException(message);
    }
  }
}
