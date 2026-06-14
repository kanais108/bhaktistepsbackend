import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { SadhanaService } from './sadhana.service';
import { CreateSadhanaDto } from './dto/create-sadhana.dto';

@Controller('sadhana')
export class SadhanaController {
  constructor(private readonly sadhanaService: SadhanaService) {}

  @Post()
  create(@Body() createSadhanaDto: CreateSadhanaDto) {
    return this.sadhanaService.create(createSadhanaDto);
  }

  @Get()
  findAll() {
    return this.sadhanaService.findAll();
  }

  @Get('today')
  async isTodayDone(
    @Query('userId') userId: string,
    @Query('entryDate') entryDate?: string,
  ) {
    this.validateUuid(userId, 'userId');

    const done = await this.sadhanaService.isSadhanaDoneToday(
      userId,
      entryDate,
    );

    return { done };
  }

  @Get('today-entry')
  async getTodayEntry(
    @Query('userId') userId: string,
    @Query('entryDate') entryDate?: string,
  ) {
    this.validateUuid(userId, 'userId');

    const entry = await this.sadhanaService.getTodaySadhanaEntry(
      userId,
      entryDate,
    );

    return { entry };
  }

  @Get('streak')
  async getStreak(
    @Query('userId') userId: string,
    @Query('entryDate') entryDate?: string,
  ) {
    this.validateUuid(userId, 'userId');

    const streak = await this.sadhanaService.getSadhanaStreak(
      userId,
      entryDate,
    );

    return { streak };
  }

  @Get('history')
  async getHistory(@Query('userId') userId: string) {
    this.validateUuid(userId, 'userId');

    return this.sadhanaService.getSadhanaHistory(userId);
  }

  @Get('report/export')
  async exportMySadhanaReport(
    @Query('userId') userId: string,
    @Query('fromDate') fromDate: string | undefined,
    @Query('toDate') toDate: string | undefined,
    @Res() response: Response,
  ) {
    this.validateUuid(userId, 'userId');

    const file = await this.sadhanaService.buildSadhanaReport({
      requesterUserId: userId,
      scope: 'me',
      fromDate,
      toDate,
    });

    this.sendExcelResponse(response, file.filename, file.buffer);
  }

  @Post('report/email')
  async emailMySadhanaReport(
    @Body()
    body: {
      userId?: string;
      fromDate?: string;
      toDate?: string;
      email?: string;
    },
  ) {
    this.validateUuid(body.userId ?? '', 'userId');
    this.validateEmail(body.email ?? '');

    return this.sadhanaService.emailSadhanaReport({
      requesterUserId: body.userId!,
      scope: 'me',
      fromDate: body.fromDate,
      toDate: body.toDate,
      recipientEmail: body.email!,
    });
  }

  @Get('members/report/export')
  async exportMembersSadhanaReport(
    @Query('facilitatorUserId') facilitatorUserId: string,
    @Query('memberUserId') memberUserId: string | undefined,
    @Query('fromDate') fromDate: string | undefined,
    @Query('toDate') toDate: string | undefined,
    @Res() response: Response,
  ) {
    this.validateUuid(facilitatorUserId, 'facilitatorUserId');

    if (memberUserId) {
      this.validateUuid(memberUserId, 'memberUserId');
    }

    const file = await this.sadhanaService.buildSadhanaReport({
      requesterUserId: facilitatorUserId,
      memberUserId,
      scope: 'members',
      fromDate,
      toDate,
    });

    this.sendExcelResponse(response, file.filename, file.buffer);
  }

  @Post('members/report/email')
  async emailMembersSadhanaReport(
    @Body()
    body: {
      facilitatorUserId?: string;
      memberUserId?: string;
      fromDate?: string;
      toDate?: string;
      email?: string;
    },
  ) {
    this.validateUuid(body.facilitatorUserId ?? '', 'facilitatorUserId');

    if (body.memberUserId) {
      this.validateUuid(body.memberUserId, 'memberUserId');
    }

    this.validateEmail(body.email ?? '');

    return this.sadhanaService.emailSadhanaReport({
      requesterUserId: body.facilitatorUserId!,
      memberUserId: body.memberUserId,
      scope: 'members',
      fromDate: body.fromDate,
      toDate: body.toDate,
      recipientEmail: body.email!,
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSadhanaDto: CreateSadhanaDto) {
    this.validateUuid(id, 'id');

    return this.sadhanaService.update(id, updateSadhanaDto);
  }

  private sendExcelResponse(
    response: Response,
    filename: string,
    buffer: Buffer,
  ) {
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    response.send(buffer);
  }

  private validateUuid(value: string, fieldName: string) {
    const cleaned = value?.toString().trim();

    if (!cleaned) {
      throw new BadRequestException(`Valid ${fieldName} UUID is required`);
    }

    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    if (!uuidRegex.test(cleaned)) {
      throw new BadRequestException(`Valid ${fieldName} UUID is required`);
    }
  }

  private validateEmail(value: string) {
    const cleaned = value?.toString().trim();

    if (!cleaned) {
      throw new BadRequestException('Valid email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleaned)) {
      throw new BadRequestException('Valid email is required');
    }
  }
}
