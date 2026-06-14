import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { Resend } from 'resend';

import { PrismaService } from '../prisma/prisma.service';
import { CreateSadhanaDto } from './dto/create-sadhana.dto';

type SadhanaReportScope = 'me' | 'members';

type BuildSadhanaReportInput = {
  requesterUserId: string;
  memberUserId?: string;
  scope: SadhanaReportScope;
  fromDate?: string;
  toDate?: string;
};

type EmailSadhanaReportInput = BuildSadhanaReportInput & {
  recipientEmail: string;
};

type SadhanaReportFile = {
  filename: string;
  buffer: Buffer;
};

@Injectable()
export class SadhanaService {
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

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

  async buildSadhanaReport(
    input: BuildSadhanaReportInput,
  ): Promise<SadhanaReportFile> {
    const { fromDate, toDate } = this.reportDateRange(
      input.fromDate,
      input.toDate,
    );

    const accessibleUserIds = await this.resolveReportUserIds(input);

    const entries = await this.prisma.sadhana.findMany({
      where: {
        userId: {
          in: accessibleUserIds,
        },
        entryDate: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: [{ entryDate: 'asc' }, { createdAt: 'asc' }],
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Bhakti Steps';
    workbook.created = new Date();
    workbook.modified = new Date();

    const detailsSheet = workbook.addWorksheet('Sadhana Details');

    detailsSheet.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Devotee Name', key: 'fullName', width: 26 },
      { header: 'Email', key: 'email', width: 34 },
      { header: 'Role', key: 'role', width: 18 },
      { header: 'Japa Rounds', key: 'japaRounds', width: 14 },
      { header: 'Mangala Arati', key: 'mangalaArati', width: 16 },
      { header: 'Tulasi Puja', key: 'tulasiPuja', width: 14 },
      { header: 'Guru Puja', key: 'guruPuja', width: 14 },
      { header: 'Bhagavatam Class', key: 'bhagavatamClass', width: 18 },
      { header: 'Reading Minutes', key: 'readingMinutes', width: 18 },
      { header: 'Service Minutes', key: 'serviceMinutes', width: 18 },
      { header: 'Slept At', key: 'sleptAt', width: 12 },
      { header: 'Woke Up At', key: 'wokeUpAt', width: 12 },
      { header: 'Notes', key: 'notes', width: 40 },
      { header: 'Submitted At', key: 'createdAt', width: 22 },
      { header: 'Updated At', key: 'updatedAt', width: 22 },
    ];

    for (const entry of entries) {
      detailsSheet.addRow({
        date: this.dateKey(entry.entryDate),
        fullName: entry.user.fullName,
        email: entry.user.email,
        role: entry.user.role,
        japaRounds: entry.japaRounds,
        mangalaArati: this.yesNo(entry.mangalaArati),
        tulasiPuja: this.yesNo(entry.tulasiPuja),
        guruPuja: this.yesNo(entry.guruPuja),
        bhagavatamClass: this.yesNo(entry.bhagavatamClass),
        readingMinutes: entry.readingMinutes,
        serviceMinutes: entry.serviceMinutes,
        sleptAt: entry.sleptAt ?? '',
        wokeUpAt: entry.wokeUpAt ?? '',
        notes: entry.notes ?? '',
        createdAt: this.formatDateTime(entry.createdAt),
        updatedAt: this.formatDateTime(entry.updatedAt),
      });
    }

    this.styleWorksheet(detailsSheet);

    const summarySheet = workbook.addWorksheet('Summary');

    summarySheet.columns = [
      { header: 'Devotee Name', key: 'fullName', width: 26 },
      { header: 'Email', key: 'email', width: 34 },
      { header: 'Days Submitted', key: 'daysSubmitted', width: 16 },
      { header: 'Average Japa Rounds', key: 'averageJapaRounds', width: 20 },
      {
        header: 'Total Reading Minutes',
        key: 'totalReadingMinutes',
        width: 22,
      },
      {
        header: 'Total Service Minutes',
        key: 'totalServiceMinutes',
        width: 22,
      },
      { header: 'Mangala Arati Count', key: 'mangalaAratiCount', width: 20 },
      { header: 'Tulasi Puja Count', key: 'tulasiPujaCount', width: 18 },
      { header: 'Guru Puja Count', key: 'guruPujaCount', width: 18 },
      {
        header: 'Bhagavatam Class Count',
        key: 'bhagavatamClassCount',
        width: 24,
      },
    ];

    const summary = new Map<
      string,
      {
        fullName: string;
        email: string;
        daysSubmitted: number;
        totalJapaRounds: number;
        totalReadingMinutes: number;
        totalServiceMinutes: number;
        mangalaAratiCount: number;
        tulasiPujaCount: number;
        guruPujaCount: number;
        bhagavatamClassCount: number;
      }
    >();

    for (const entry of entries) {
      const existing = summary.get(entry.userId) ?? {
        fullName: entry.user.fullName,
        email: entry.user.email,
        daysSubmitted: 0,
        totalJapaRounds: 0,
        totalReadingMinutes: 0,
        totalServiceMinutes: 0,
        mangalaAratiCount: 0,
        tulasiPujaCount: 0,
        guruPujaCount: 0,
        bhagavatamClassCount: 0,
      };

      existing.daysSubmitted += 1;
      existing.totalJapaRounds += entry.japaRounds;
      existing.totalReadingMinutes += entry.readingMinutes;
      existing.totalServiceMinutes += entry.serviceMinutes;
      existing.mangalaAratiCount += entry.mangalaArati ? 1 : 0;
      existing.tulasiPujaCount += entry.tulasiPuja ? 1 : 0;
      existing.guruPujaCount += entry.guruPuja ? 1 : 0;
      existing.bhagavatamClassCount += entry.bhagavatamClass ? 1 : 0;

      summary.set(entry.userId, existing);
    }

    for (const item of summary.values()) {
      summarySheet.addRow({
        fullName: item.fullName,
        email: item.email,
        daysSubmitted: item.daysSubmitted,
        averageJapaRounds:
          item.daysSubmitted === 0
            ? 0
            : Number((item.totalJapaRounds / item.daysSubmitted).toFixed(2)),
        totalReadingMinutes: item.totalReadingMinutes,
        totalServiceMinutes: item.totalServiceMinutes,
        mangalaAratiCount: item.mangalaAratiCount,
        tulasiPujaCount: item.tulasiPujaCount,
        guruPujaCount: item.guruPujaCount,
        bhagavatamClassCount: item.bhagavatamClassCount,
      });
    }

    this.styleWorksheet(summarySheet);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const filenamePrefix =
      input.scope === 'me'
        ? 'bhakti-steps-my-sadhana'
        : 'bhakti-steps-members-sadhana';

    const filename = `${filenamePrefix}-${this.dateKey(fromDate)}-to-${this.dateKey(
      toDate,
    )}.xlsx`;

    return {
      filename,
      buffer,
    };
  }

  async emailSadhanaReport(input: EmailSadhanaReportInput) {
    const from = process.env.RESEND_FROM_EMAIL;

    if (!from) {
      throw new InternalServerErrorException(
        'RESEND_FROM_EMAIL is not configured',
      );
    }

    const report = await this.buildSadhanaReport(input);

    const { fromDate, toDate } = this.reportDateRange(
      input.fromDate,
      input.toDate,
    );

    const { error } = await this.resend.emails.send({
      from,
      to: input.recipientEmail.trim().toLowerCase(),
      subject: 'Bhakti Steps Sadhana Report',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Bhakti Steps Sadhana Report</h2>
          <p>Hare Krishna,</p>
          <p>Please find attached the Sadhana report for the selected date range.</p>
          <p><strong>From:</strong> ${this.dateKey(fromDate)}</p>
          <p><strong>To:</strong> ${this.dateKey(toDate)}</p>
          <p>Your servant,<br/>Bhakti Steps</p>
        </div>
      `,
      attachments: [
        {
          filename: report.filename,
          content: report.buffer,
        },
      ],
    });

    if (error) {
      console.error('Resend sadhana report error:', error);
      throw new InternalServerErrorException('Failed to email Sadhana report');
    }

    return {
      message: 'Sadhana report emailed successfully',
    };
  }

  private async resolveReportUserIds(
    input: BuildSadhanaReportInput,
  ): Promise<string[]> {
    const requester = await this.prisma.user.findUnique({
      where: { id: input.requesterUserId },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!requester || !requester.isActive) {
      throw new NotFoundException('User not found');
    }

    if (input.scope === 'me') {
      return [requester.id];
    }

    if (requester.role === UserRole.SUPER_ADMIN) {
      if (input.memberUserId) {
        return [input.memberUserId];
      }

      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      return users.map((user) => user.id);
    }

    if (!this.isFacilitatorRole(requester.role)) {
      throw new ForbiddenException(
        'You are not allowed to view member reports',
      );
    }

    const allowedIds = await this.collectSubordinateUserIds(requester.id);
    allowedIds.add(requester.id);

    if (input.memberUserId) {
      if (!allowedIds.has(input.memberUserId)) {
        throw new ForbiddenException(
          'You are not allowed to view this member report',
        );
      }

      return [input.memberUserId];
    }

    return [...allowedIds];
  }

  private async collectSubordinateUserIds(rootUserId: string) {
    const collected = new Set<string>();
    let currentLevel = [rootUserId];

    for (let depth = 0; depth < 10; depth++) {
      const subordinates = await this.prisma.user.findMany({
        where: {
          isActive: true,
          reportsToUserId: {
            in: currentLevel,
          },
        },
        select: {
          id: true,
        },
      });

      const nextLevel = subordinates
        .map((user) => user.id)
        .filter((id) => !collected.has(id));

      if (nextLevel.length === 0) {
        break;
      }

      for (const id of nextLevel) {
        collected.add(id);
      }

      currentLevel = nextLevel;
    }

    return collected;
  }

  private isFacilitatorRole(role: UserRole) {
    return (
      role === UserRole.SERVANT_LEADER ||
      role === UserRole.SECTOR_LEADER ||
      role === UserRole.CIRCLE_LEADER
    );
  }

  private reportDateRange(fromDate?: string, toDate?: string) {
    const now = new Date();

    const defaultTo = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
    );

    const defaultFrom = new Date(defaultTo);
    defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 30);
    defaultFrom.setUTCHours(0, 0, 0, 0);

    const from = fromDate
      ? this.parseDateKey(fromDate, 'fromDate')
      : defaultFrom;

    const to = toDate ? this.parseDateKey(toDate, 'toDate', true) : defaultTo;

    if (from > to) {
      throw new BadRequestException('fromDate cannot be after toDate');
    }

    return {
      fromDate: from,
      toDate: to,
    };
  }

  private parseDateKey(value: string, fieldName: string, endOfDay = false) {
    const cleaned = value?.trim();

    if (!cleaned || !this.isValidDateKey(cleaned)) {
      throw new BadRequestException(`Valid ${fieldName} is required`);
    }

    const [year, month, day] = cleaned.split('-').map(Number);

    return new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        endOfDay ? 23 : 0,
        endOfDay ? 59 : 0,
        endOfDay ? 59 : 0,
        endOfDay ? 999 : 0,
      ),
    );
  }

  private styleWorksheet(sheet: ExcelJS.Worksheet) {
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2F6FED' },
    };
    sheet.getRow(1).alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = {
          vertical: 'top',
          wrapText: true,
        };
      });
    });
  }

  private yesNo(value: boolean) {
    return value ? 'Yes' : 'No';
  }

  private formatDateTime(value: Date) {
    return value.toISOString().replace('T', ' ').substring(0, 19);
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
