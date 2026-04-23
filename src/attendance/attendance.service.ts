import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessScopeService } from '../authz/access-scope.service';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessScopeService: AccessScopeService,
  ) {}

  async create(data: {
    eventId: string;
    userId: string;
    status?: string;
    remarks?: string;
    markedByUserId?: string;
  }) {
    const event = await this.prisma.event.findUnique({
      where: { id: data.eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    try {
      return await this.prisma.attendance.create({
        data: {
          eventId: data.eventId,
          userId: data.userId,
          status: data.status ?? 'present',
          remarks: data.remarks ?? null,
          markedByUserId: data.markedByUserId ?? null,
          treeId: event.treeId ?? null,
        },
        include: {
          event: true,
          user: true,
          markedByUser: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Attendance already marked for this user and event',
        );
      }
      throw error;
    }
  }

  async bulkCreate(data: {
    eventId: string;
    entries: {
      userId: string;
      status?: string;
      remarks?: string;
    }[];
    markedByUserId?: string;
  }) {
    const event = await this.prisma.event.findUnique({
      where: { id: data.eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const results: any[] = [];

    for (const entry of data.entries) {
      const existing = await this.prisma.attendance.findUnique({
        where: {
          eventId_userId: {
            eventId: data.eventId,
            userId: entry.userId,
          },
        },
      });

      if (existing) {
        const updated = await this.prisma.attendance.update({
          where: {
            eventId_userId: {
              eventId: data.eventId,
              userId: entry.userId,
            },
          },
          data: {
            status: entry.status ?? 'present',
            remarks: entry.remarks ?? null,
            markedByUserId: data.markedByUserId ?? existing.markedByUserId,
            treeId: event.treeId ?? existing.treeId,
          },
        });

        results.push(updated);
      } else {
        const created = await this.prisma.attendance.create({
          data: {
            eventId: data.eventId,
            userId: entry.userId,
            status: entry.status ?? 'present',
            remarks: entry.remarks ?? null,
            markedByUserId: data.markedByUserId ?? null,
            treeId: event.treeId ?? null,
          },
        });

        results.push(created);
      }
    }

    return results;
  }

  async findAllScoped(viewerUserId: string) {
    const { accessibleUserIds, currentUser } =
      await this.accessScopeService.getScopedUserIdsAndTree(viewerUserId);

    const where: Prisma.AttendanceWhereInput = {};

    if (accessibleUserIds !== null) {
      where.markedByUserId = { in: accessibleUserIds };

      if (currentUser.treeId) {
        where.treeId = currentUser.treeId;
      }
    }

    return this.prisma.attendance.findMany({
      where,
      orderBy: { markedAt: 'desc' },
      include: {
        event: true,
        user: true,
        markedByUser: true,
      },
    });
  }
}
