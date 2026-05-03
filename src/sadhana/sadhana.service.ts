import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateSadhanaDto } from './dto/create-sadhana.dto';

@Injectable()
export class SadhanaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSadhanaDto: CreateSadhanaDto) {
    try {
      return await this.prisma.sadhana.create({
        data: this.toSadhanaData(createSadhanaDto),
        include: {
          user: true,
        },
      });
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  async update(id: string, updateSadhanaDto: CreateSadhanaDto) {
    try {
      return await this.prisma.sadhana.update({
        where: { id },
        data: this.toSadhanaData(updateSadhanaDto),
        include: {
          user: true,
        },
      });
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  async findAll() {
    return this.prisma.sadhana.findMany({
      orderBy: { entryDate: 'desc' },
      include: {
        user: true,
      },
    });
  }

  async isSadhanaDoneToday(
    userId: string,
    entryDate?: string,
  ): Promise<boolean> {
    const entry = await this.getTodaySadhanaEntry(userId, entryDate);
    return entry !== null;
  }

  async getTodaySadhanaEntry(userId: string, entryDate?: string) {
    const { startOfDay, endOfDay } = this.dateRange(entryDate);

    return this.prisma.sadhana.findFirst({
      where: {
        userId,
        entryDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        entryDate: 'desc',
      },
    });
  }
  private dateRange(entryDate?: string) {
    const raw = entryDate?.trim();

    if (raw) {
      const [year, month, day] = raw.split('-').map(Number);

      if (!year || !month || !day) {
        throw new BadRequestException('Valid entryDate is required');
      }

      const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      const endOfDay = new Date(
        Date.UTC(year, month - 1, day, 23, 59, 59, 999),
      );

      return { startOfDay, endOfDay };
    }

    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    return { startOfDay, endOfDay };
  }
  async getSadhanaHistory(userId: string) {
    return this.prisma.sadhana.findMany({
      where: { userId },
      orderBy: { entryDate: 'desc' },
      take: 30,
    });
  }

  async getSadhanaStreak(userId: string, entryDate?: string): Promise<number> {
    const entries = await this.prisma.sadhana.findMany({
      where: { userId },
      select: { entryDate: true },
      orderBy: { entryDate: 'desc' },
      take: 365,
    });

    if (entries.length === 0) {
      return 0;
    }

    const dayKeys = new Set(
      entries.map((entry) => this.dateKey(entry.entryDate)),
    );

    let currentKey = entryDate?.trim();

    if (!currentKey) {
      currentKey = this.dateKey(new Date());
    }

    if (!this.isValidDateKey(currentKey)) {
      throw new BadRequestException('Valid entryDate is required');
    }

    const yesterdayKey = this.shiftDateKey(currentKey, -1);

    if (!dayKeys.has(currentKey)) {
      if (dayKeys.has(yesterdayKey)) {
        currentKey = yesterdayKey;
      } else {
        return 0;
      }
    }

    let streak = 0;

    while (dayKeys.has(currentKey)) {
      streak++;
      currentKey = this.shiftDateKey(currentKey, -1);
    }

    return streak;
  }

  private dateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private isValidDateKey(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  private shiftDateKey(value: string, days: number): string {
    const [year, month, day] = value.split('-').map(Number);

    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() + days);

    return date.toISOString().split('T')[0];
  }

  private todayRange() {
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    return { startOfDay, endOfDay };
  }

  private toSadhanaData(dto: CreateSadhanaDto) {
    return {
      userId: dto.userId,
      entryDate: new Date(dto.entryDate),
      japaRounds: dto.japaRounds,
      mangalaArati: dto.mangalaArati ?? false,
      tulasiPuja: dto.tulasiPuja ?? false,
      guruPuja: dto.guruPuja ?? false,
      bhagavatamClass: dto.bhagavatamClass ?? false,
      readingMinutes: dto.readingMinutes ?? 0,
      serviceMinutes: dto.serviceMinutes ?? 0,
      sleptAt: dto.sleptAt ?? null,
      wokeUpAt: dto.wokeUpAt ?? null,
      notes: dto.notes ?? null,
    };
  }

  private handlePrismaWriteError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Sadhana already submitted for this user and date',
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException('Sadhana entry not found');
    }

    throw error;
  }
}
