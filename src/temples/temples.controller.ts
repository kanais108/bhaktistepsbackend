import { Body, Controller, Get, Post } from '@nestjs/common';
import { Temple } from '@prisma/client';
import { TemplesService } from './temples.service';
import { CreateTempleDto } from './dto/create-temple.dto';

@Controller('temples')
export class TemplesController {
  constructor(private readonly templesService: TemplesService) {}

  @Post()
  create(@Body() createTempleDto: CreateTempleDto): Promise<Temple> {
    return this.templesService.create(createTempleDto);
  }

  @Get()
  findAll(): Promise<Temple[]> {
    return this.templesService.findAll();
  }
}
