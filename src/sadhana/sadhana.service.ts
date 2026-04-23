import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSadhanaDto } from './dto/create-sadhana.dto';

@Injectable()
export class SadhanaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSadhanaDto: CreateSadhanaDto) {
    try {
      return await this.prisma.sadhana.create({
        data: {
          userId: createSadhanaDto.userId,
          entryDate: new Date(createSadhanaDto.entryDate),
          japaRounds: createSadhanaDto.japaRounds,
          mangalaArati: createSadhanaDto.mangalaArati ?? false,
          tulasiPuja: createSadhanaDto.tulasiPuja ?? false,
          guruPuja: createSadhanaDto.guruPuja ?? false,
          bhagavatamClass: createSadhanaDto.bhagavatamClass ?? false,
          readingMinutes: createSadhanaDto.readingMinutes ?? 0,
          serviceMinutes: createSadhanaDto.serviceMinutes ?? 0,
          sleptAt: createSadhanaDto.sleptAt ?? null,
          wokeUpAt: createSadhanaDto.wokeUpAt ?? null,
          notes: createSadhanaDto.notes ?? null,
        },
        include: {
          user: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Sadhana already submitted for this user and date',
        );
      }
      throw error;
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
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await this.prisma.sadhana.count({
      where: {
        userId,
        entryDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return count > 0;
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
}
