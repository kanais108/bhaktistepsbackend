import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccessScopeService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getAccessibleUserIds(currentUserId: string): Promise<string[] | null> {
    const currentUser = await this.getUserOrThrow(currentUserId);

    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return null;
    }

    if (currentUser.role === UserRole.DEVOTEE) {
      return [currentUser.id];
    }

    if (!currentUser.treeId) {
      return [currentUser.id];
    }

    if (currentUser.role === UserRole.SERVANT_LEADER) {
      return [currentUser.id];
    }

    if (currentUser.role === UserRole.SECTOR_LEADER) {
      const servantLeaders = await this.prisma.user.findMany({
        where: {
          treeId: currentUser.treeId,
          reportsToUserId: currentUser.id,
          role: UserRole.SERVANT_LEADER,
          isActive: true,
        },
        select: { id: true },
      });

      return [currentUser.id, ...servantLeaders.map((u) => u.id)];
    }

    if (currentUser.role === UserRole.CIRCLE_LEADER) {
      const sectorLeaders = await this.prisma.user.findMany({
        where: {
          treeId: currentUser.treeId,
          reportsToUserId: currentUser.id,
          role: UserRole.SECTOR_LEADER,
          isActive: true,
        },
        select: { id: true },
      });

      const sectorLeaderIds = sectorLeaders.map((u) => u.id);

      const servantLeaders = await this.prisma.user.findMany({
        where: {
          treeId: currentUser.treeId,
          reportsToUserId: { in: sectorLeaderIds },
          role: UserRole.SERVANT_LEADER,
          isActive: true,
        },
        select: { id: true },
      });

      return [
        currentUser.id,
        ...sectorLeaderIds,
        ...servantLeaders.map((u) => u.id),
      ];
    }

    return [currentUser.id];
  }

  async getScopedUserIdsAndTree(currentUserId: string) {
    const currentUser = await this.getUserOrThrow(currentUserId);
    const accessibleUserIds = await this.getAccessibleUserIds(currentUserId);

    return {
      currentUser,
      accessibleUserIds,
      treeId: currentUser.treeId,
    };
  }
}
