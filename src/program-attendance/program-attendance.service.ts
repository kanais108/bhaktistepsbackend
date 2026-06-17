import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { BulkProgramAttendanceDto } from './dto/bulk-program-attendance.dto';
import { CreateProgramSessionDto } from './dto/create-program-session.dto';

@Injectable()
export class ProgramAttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyBatches(viewerUserId: string) {
    const viewer = await this.getActiveUserOrThrow(viewerUserId);

    const where: Prisma.ProgramBatchWhereInput =
      viewer.role === UserRole.SUPER_ADMIN
        ? {
            isActive: true,
          }
        : {
            isActive: true,
            OR: [
              {
                leaderId: viewer.id,
              },
              ...(viewer.treeId
                ? [
                    {
                      treeId: viewer.treeId,
                    },
                  ]
                : []),
            ],
          };

    return this.prisma.programBatch.findMany({
      where,
      orderBy: [
        {
          createdAt: 'desc',
        },
      ],
      include: {
        program: true,
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

  async getBatchMembers(viewerUserId: string, batchId: string) {
    await this.assertCanAccessBatch(viewerUserId, batchId);

    const members = await this.prisma.programMember.findMany({
      where: {
        batchId,
        isActive: true,
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

    return members
      .filter((member) => member.user.isActive)
      .map((member) => ({
        id: member.id,
        userId: member.user.id,
        fullName: member.user.fullName,
        email: member.user.email,
        role: member.user.role,
      }));
  }

  async getBatchSessions(viewerUserId: string, batchId: string) {
    await this.assertCanAccessBatch(viewerUserId, batchId);

    return this.prisma.programSession.findMany({
      where: { batchId },
      orderBy: [{ weekNumber: 'asc' }, { sessionDate: 'asc' }],
      include: {
        _count: {
          select: {
            attendance: true,
          },
        },
      },
    });
  }

  async createSession(viewerUserId: string, dto: CreateProgramSessionDto) {
    await this.assertCanAccessBatch(viewerUserId, dto.batchId);

    if (!dto.weekNumber || dto.weekNumber < 1) {
      throw new BadRequestException('Valid weekNumber is required');
    }

    if (!dto.sessionDate || !this.isValidDateKey(dto.sessionDate)) {
      throw new BadRequestException('Valid sessionDate is required');
    }

    try {
      return await this.prisma.programSession.create({
        data: {
          batchId: dto.batchId,
          weekNumber: dto.weekNumber,
          sessionDate: new Date(`${dto.sessionDate}T00:00:00.000Z`),
          title: dto.title?.trim() || null,
          notes: dto.notes?.trim() || null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'A session already exists for this week number',
        );
      }

      throw error;
    }
  }

  async getSessionAttendance(viewerUserId: string, sessionId: string) {
    const session = await this.getSessionOrThrow(sessionId);
    await this.assertCanAccessBatch(viewerUserId, session.batchId);

    return this.prisma.programAttendance.findMany({
      where: { sessionId },
      orderBy: {
        user: {
          fullName: 'asc',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async saveBulkAttendance(
    viewerUserId: string,
    dto: BulkProgramAttendanceDto,
  ) {
    const session = await this.getSessionOrThrow(dto.sessionId);
    await this.assertCanAccessBatch(viewerUserId, session.batchId);

    if (!dto.records || dto.records.length === 0) {
      throw new BadRequestException('Attendance records are required');
    }

    const batchMembers = await this.prisma.programMember.findMany({
      where: {
        batchId: session.batchId,
        isActive: true,
      },
      select: {
        userId: true,
      },
    });

    const allowedUserIds = new Set(batchMembers.map((member) => member.userId));

    for (const record of dto.records) {
      if (!allowedUserIds.has(record.userId)) {
        throw new ForbiddenException(
          'One or more users do not belong to this program batch',
        );
      }

      if (record.status !== 'present' && record.status !== 'absent') {
        throw new BadRequestException(
          'Attendance status must be present or absent',
        );
      }
    }

    const results = await this.prisma.$transaction(
      dto.records.map((record) =>
        this.prisma.programAttendance.upsert({
          where: {
            sessionId_userId: {
              sessionId: dto.sessionId,
              userId: record.userId,
            },
          },
          update: {
            status: record.status,
            remarks: record.remarks?.trim() || null,
            markedByUserId: viewerUserId,
            markedAt: new Date(),
          },
          create: {
            sessionId: dto.sessionId,
            userId: record.userId,
            status: record.status,
            remarks: record.remarks?.trim() || null,
            markedByUserId: viewerUserId,
          },
        }),
      ),
    );

    return {
      message: 'Program attendance saved successfully',
      count: results.length,
    };
  }

  private async getActiveUserOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async getSessionOrThrow(sessionId: string) {
    const session = await this.prisma.programSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Program session not found');
    }

    return session;
  }

  private async assertCanAccessBatch(viewerUserId: string, batchId: string) {
    const viewer = await this.getActiveUserOrThrow(viewerUserId);

    const batch = await this.prisma.programBatch.findUnique({
      where: { id: batchId },
      include: {
        program: true,
      },
    });

    if (!batch || !batch.isActive || !batch.program.isActive) {
      throw new NotFoundException('Program batch not found');
    }

    if (viewer.role === UserRole.SUPER_ADMIN) {
      return batch;
    }

    if (batch.leaderId === viewer.id) {
      return batch;
    }

    if (viewer.treeId && batch.treeId && viewer.treeId === batch.treeId) {
      return batch;
    }

    throw new ForbiddenException(
      'You do not have access to this program batch',
    );
  }

  private isValidDateKey(value: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }
}
