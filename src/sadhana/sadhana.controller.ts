import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

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
  async isTodayDone(@Query('userId') userId: string) {
    this.validateUuid(userId, 'userId');

    const done = await this.sadhanaService.isSadhanaDoneToday(userId);
    return { done };
  }

  @Get('today-entry')
  async getTodayEntry(@Query('userId') userId: string) {
    this.validateUuid(userId, 'userId');

    const entry = await this.sadhanaService.getTodaySadhanaEntry(userId);
    return { entry };
  }

  @Get('streak')
  async getStreak(@Query('userId') userId: string) {
    this.validateUuid(userId, 'userId');

    const streak = await this.sadhanaService.getSadhanaStreak(userId);
    return { streak };
  }

  @Get('history')
  async getHistory(@Query('userId') userId: string) {
    this.validateUuid(userId, 'userId');

    return this.sadhanaService.getSadhanaHistory(userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSadhanaDto: CreateSadhanaDto) {
    this.validateUuid(id, 'id');

    return this.sadhanaService.update(id, updateSadhanaDto);
  }

  private validateUuid(value: string, fieldName: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

    if (!value || !uuidRegex.test(value)) {
      throw new BadRequestException(`Valid ${fieldName} UUID is required`);
    }
  }
}
