import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessScopeService } from '../authz/access-scope.service';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessScopeService: AccessScopeService,
  ) {}

  async create(data: {
    templeId: string;
    groupId?: string | null;
    category: any;
    title: string;
    description?: string | null;
    eventMode?: any;
    locationName?: string | null;
    startsAt: Date;
    endsAt: Date;
    attendanceMode?: any;
    createdByUserId?: string | null;
  }) {
    let treeId: string | null = null;

    if (data.createdByUserId) {
      const creator = await this.prisma.user.findUnique({
        where: { id: data.createdByUserId },
      });

      if (!creator) {
        throw new NotFoundException('Creator user not found');
      }

      treeId = creator.treeId ?? null;
    }

    return this.prisma.event.create({
      data: {
        templeId: data.templeId,
        groupId: data.groupId ?? null,
        category: data.category,
        title: data.title,
        description: data.description ?? null,
        eventMode: data.eventMode ?? 'offline',
        locationName: data.locationName ?? null,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        attendanceMode: data.attendanceMode ?? 'qr',
        createdByUserId: data.createdByUserId ?? null,
        treeId,
      },
      include: {
        temple: true,
        group: true,
        createdByUser: true,
        tree: true,
      },
    });
  }

  async findAllScoped(viewerUserId: string) {
    const { accessibleUserIds, currentUser } =
      await this.accessScopeService.getScopedUserIdsAndTree(viewerUserId);

    const where: Prisma.EventWhereInput = {
      isActive: true,
    };

    if (accessibleUserIds !== null) {
      where.createdByUserId = { in: accessibleUserIds };

      if (currentUser.treeId) {
        where.treeId = currentUser.treeId;
      }
    }

    return this.prisma.event.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      include: {
        temple: true,
        group: true,
        createdByUser: true,
      },
    });
  }

  async update(
    eventId: string,
    viewerUserId: string,
    data: {
      templeId?: string;
      groupId?: string | null;
      category?: any;
      title?: string;
      description?: string | null;
      eventMode?: any;
      locationName?: string | null;
      startsAt?: Date;
      endsAt?: Date;
      attendanceMode?: any;
      isActive?: boolean;
    },
  ) {
    const { accessibleUserIds, currentUser } =
      await this.accessScopeService.getScopedUserIdsAndTree(viewerUserId);

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (accessibleUserIds !== null) {
      if (
        !event.createdByUserId ||
        !accessibleUserIds.includes(event.createdByUserId)
      ) {
        throw new ForbiddenException(
          'You do not have permission to update this event',
        );
      }

      if (currentUser.treeId && event.treeId !== currentUser.treeId) {
        throw new ForbiddenException(
          'You do not have permission to update this event',
        );
      }
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        templeId: data.templeId ?? event.templeId,
        groupId: data.groupId !== undefined ? data.groupId : event.groupId,
        category: data.category ?? event.category,
        title: data.title ?? event.title,
        description:
          data.description !== undefined ? data.description : event.description,
        eventMode: data.eventMode ?? event.eventMode,
        locationName:
          data.locationName !== undefined
            ? data.locationName
            : event.locationName,
        startsAt: data.startsAt ?? event.startsAt,
        endsAt: data.endsAt ?? event.endsAt,
        attendanceMode: data.attendanceMode ?? event.attendanceMode,
        isActive: data.isActive !== undefined ? data.isActive : event.isActive,
      },
      include: {
        temple: true,
        group: true,
        createdByUser: true,
        tree: true,
      },
    });
  }

  async deactivate(eventId: string, viewerUserId: string) {
    return this.update(eventId, viewerUserId, {
      isActive: false,
    });
  }
}
