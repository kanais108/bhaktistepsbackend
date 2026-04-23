import { Injectable } from '@nestjs/common';
import { Group, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessScopeService } from '../authz/access-scope.service';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessScopeService: AccessScopeService,
  ) {}

  create(createGroupDto: CreateGroupDto): Prisma.Prisma__GroupClient<Group> {
    return this.prisma.group.create({
      data: {
        templeId: createGroupDto.templeId,
        name: createGroupDto.name,
        code: createGroupDto.code,
        groupType: createGroupDto.groupType,
      },
      include: {
        temple: true,
      },
    });
  }

  findAll(): Prisma.PrismaPromise<Group[]> {
    return this.prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllScoped(viewerUserId: string): Promise<Group[]> {
    const { accessibleUserIds } =
      await this.accessScopeService.getScopedUserIdsAndTree(viewerUserId);

    if (accessibleUserIds === null) {
      return this.prisma.group.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: {
              in: accessibleUserIds,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
