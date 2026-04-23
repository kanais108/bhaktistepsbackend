import { Injectable } from '@nestjs/common';
import { Prisma, Temple } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTempleDto } from './dto/create-temple.dto';

@Injectable()
export class TemplesService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    createTempleDto: CreateTempleDto,
  ): Prisma.Prisma__TempleClient<Temple> {
    return this.prisma.temple.create({
      data: createTempleDto,
    });
  }

  findAll(): Prisma.PrismaPromise<Temple[]> {
    return this.prisma.temple.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
