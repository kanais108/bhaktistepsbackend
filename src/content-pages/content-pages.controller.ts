import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { ContentPagesService } from './content-pages.service';
import { UpsertContentPageDto } from './dto/upsert-content-page.dto';

@Controller('content-pages')
export class ContentPagesController {
  constructor(private readonly contentPagesService: ContentPagesService) {}

  @Get()
  findAll() {
    return this.contentPagesService.findAll();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.contentPagesService.findBySlug(slug);
  }

  @Post()
  upsert(@Body() dto: UpsertContentPageDto) {
    return this.contentPagesService.upsert(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpsertContentPageDto) {
    return this.contentPagesService.update(id, dto);
  }
}
