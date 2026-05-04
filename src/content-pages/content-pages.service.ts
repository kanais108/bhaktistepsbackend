import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UpsertContentPageDto } from './dto/upsert-content-page.dto';

@Injectable()
export class ContentPagesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.contentPage.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const cleanedSlug = this.cleanSlug(slug);

    const page = await this.prisma.contentPage.findUnique({
      where: { slug: cleanedSlug },
    });

    if (!page || !page.isActive) {
      throw new NotFoundException('Content page not found');
    }

    return page;
  }

  async upsert(dto: UpsertContentPageDto) {
    const slug = this.cleanSlug(dto.slug);

    if (!dto.title?.trim()) {
      throw new BadRequestException('Title is required');
    }

    if (!dto.body?.trim()) {
      throw new BadRequestException('Body is required');
    }

    return this.prisma.contentPage.upsert({
      where: { slug },
      create: {
        slug,
        title: dto.title.trim(),
        subtitle: dto.subtitle?.trim() || null,
        body: dto.body.trim(),
        heroImageUrl: dto.heroImageUrl?.trim() || null,
        isActive: dto.isActive ?? true,
      },
      update: {
        title: dto.title.trim(),
        subtitle: dto.subtitle?.trim() || null,
        body: dto.body.trim(),
        heroImageUrl: dto.heroImageUrl?.trim() || null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpsertContentPageDto) {
    const existing = await this.prisma.contentPage.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Content page not found');
    }

    return this.prisma.contentPage.update({
      where: { id },
      data: {
        slug: this.cleanSlug(dto.slug),
        title: dto.title.trim(),
        subtitle: dto.subtitle?.trim() || null,
        body: dto.body.trim(),
        heroImageUrl: dto.heroImageUrl?.trim() || null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  private cleanSlug(value: string) {
    const slug = value?.toString().trim().toLowerCase();

    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      throw new BadRequestException(
        'Slug must contain only lowercase letters, numbers, and hyphens',
      );
    }

    return slug;
  }
}
