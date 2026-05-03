import {
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

  async isSadhanaDoneToday(userId: string): Promise<boolean> {
    const entry = await this.getTodaySadhanaEntry(userId);
    return entry !== null;
  }

  async getTodaySadhanaEntry(userId: string) {
    const { startOfDay, endOfDay } = this.todayRange();

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

  async getSadhanaHistory(userId: string) {
    return this.prisma.sadhana.findMany({
      where: { userId },
      orderBy: { entryDate: 'desc' },
      take: 30,
    });
  }

  async getSadhanaStreak(userId: string): Promise<number> {
    const entries = await this.prisma.sadhana.findMany({
      where: { userId },
      select: { entryDate: true },
      orderBy: { entryDate: 'desc' },
      take: 60,
    });

    if (entries.length === 0) {
      return 0;
    }

    const uniqueDays = Array.from(
      new Set(
        entries.map((entry) => {
          const d = new Date(entry.entryDate);
          return new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate(),
          ).toISOString();
        }),
      ),
    )
      .map((day) => new Date(day))
      .sort((a, b) => b.getTime() - a.getTime());

    const today = new Date();

    let current = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    let streak = 0;

    const first = uniqueDays[0];

    const yesterday = new Date(current);
    yesterday.setDate(yesterday.getDate() - 1);

    const startsToday = first.getTime() === current.getTime();
    const startsYesterday = first.getTime() === yesterday.getTime();

    if (!startsToday && !startsYesterday) {
      return 0;
    }

    if (!startsToday) {
      current = yesterday;
    }

    for (const day of uniqueDays) {
      if (day.getTime() === current.getTime()) {
        streak++;
        current = new Date(current);
        current.setDate(current.getDate() - 1);
      } else if (day.getTime() < current.getTime()) {
        break;
      }
    }

    return streak;
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
