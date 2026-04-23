import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessScopeService } from '../authz/access-scope.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessScopeService: AccessScopeService,
  ) {}

  async getDashboard(viewerUserId: string) {
    const { accessibleUserIds, currentUser } =
      await this.accessScopeService.getScopedUserIdsAndTree(viewerUserId);

    const usersWhere: Prisma.UserWhereInput =
      accessibleUserIds === null
        ? {}
        : {
            id: { in: accessibleUserIds },
          };

    const groupsWhere: Prisma.GroupWhereInput =
      accessibleUserIds === null
        ? {}
        : {
            members: {
              some: {
                userId: { in: accessibleUserIds },
              },
            },
          };

    const eventsWhere: Prisma.EventWhereInput =
      accessibleUserIds === null
        ? { isActive: true }
        : {
            isActive: true,
            createdByUserId: { in: accessibleUserIds },
            ...(currentUser.treeId ? { treeId: currentUser.treeId } : {}),
          };

    const attendanceWhere: Prisma.AttendanceWhereInput =
      accessibleUserIds === null
        ? {}
        : {
            userId: { in: accessibleUserIds },
            ...(currentUser.treeId ? { treeId: currentUser.treeId } : {}),
          };

    const now = new Date();
    const next30Days = new Date();
    next30Days.setDate(now.getDate() + 30);

    const upcomingEventsWhere: Prisma.EventWhereInput = {
      ...eventsWhere,
      startsAt: {
        gte: now,
        lte: next30Days,
      },
    };

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalGroups,
      totalEvents,
      upcomingEvents,
      totalAttendanceRecords,
      recentAttendanceRecords,
    ] = await Promise.all([
      this.prisma.user.count({ where: usersWhere }),
      this.prisma.user.count({
        where: {
          ...usersWhere,
          isActive: true,
        },
      }),
      this.prisma.user.count({
        where: {
          ...usersWhere,
          isActive: false,
        },
      }),
      this.prisma.group.count({ where: groupsWhere }),
      this.prisma.event.count({ where: eventsWhere }),
      this.prisma.event.count({ where: upcomingEventsWhere }),
      this.prisma.attendance.count({ where: attendanceWhere }),
      this.prisma.attendance.count({
        where: {
          ...attendanceWhere,
          markedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      scope: {
        viewerUserId,
        role: currentUser.role,
        treeId: currentUser.treeId,
        isSuperAdmin: accessibleUserIds === null,
      },
      summary: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalGroups,
        totalEvents,
        upcomingEvents,
        totalAttendanceRecords,
        recentAttendanceRecords,
      },
    };
  }
}
