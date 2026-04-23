import {
  BadRequestException,
  Body,
  Controller,
  Get,
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
    this.validateUuid(userId);
    const done = await this.sadhanaService.isSadhanaDoneToday(userId);
    return { done };
  }

  @Get('streak')
  async getStreak(@Query('userId') userId: string) {
    this.validateUuid(userId);
    const streak = await this.sadhanaService.getSadhanaStreak(userId);
    return { streak };
  }

  @Get('history')
  async getHistory(@Query('userId') userId: string) {
    this.validateUuid(userId);
    return this.sadhanaService.getSadhanaHistory(userId);
  }

  private validateUuid(userId: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!userId || !uuidRegex.test(userId)) {
      throw new BadRequestException('Valid userId UUID is required');
    }
  }
}
