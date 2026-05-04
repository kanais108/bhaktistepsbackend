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
      orderBy: [{ parentSlug: 'asc' }, { sortOrder: 'asc' }, { title: 'asc' }],
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

  async findChildren(parentSlug: string) {
    const cleanedParentSlug = this.cleanSlug(parentSlug);

    return this.prisma.contentPage.findMany({
      where: {
        parentSlug: cleanedParentSlug,
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
  }

  async upsert(dto: UpsertContentPageDto) {
    const slug = this.cleanSlug(dto.slug);
    const parentSlug = dto.parentSlug?.trim()
      ? this.cleanSlug(dto.parentSlug)
      : null;

    this.validateRequiredFields(dto);

    return this.prisma.contentPage.upsert({
      where: { slug },
      create: {
        slug,
        parentSlug,
        title: dto.title.trim(),
        subtitle: dto.subtitle?.trim() || null,
        body: dto.body.trim(),
        heroImageUrl: dto.heroImageUrl?.trim() || null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
      update: {
        parentSlug,
        title: dto.title.trim(),
        subtitle: dto.subtitle?.trim() || null,
        body: dto.body.trim(),
        heroImageUrl: dto.heroImageUrl?.trim() || null,
        sortOrder: dto.sortOrder ?? 0,
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

    this.validateRequiredFields(dto);

    return this.prisma.contentPage.update({
      where: { id },
      data: {
        slug: this.cleanSlug(dto.slug),
        parentSlug: dto.parentSlug?.trim()
          ? this.cleanSlug(dto.parentSlug)
          : null,
        title: dto.title.trim(),
        subtitle: dto.subtitle?.trim() || null,
        body: dto.body.trim(),
        heroImageUrl: dto.heroImageUrl?.trim() || null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  private validateRequiredFields(dto: UpsertContentPageDto) {
    if (!dto.title?.trim()) {
      throw new BadRequestException('Title is required');
    }

    if (!dto.body?.trim()) {
      throw new BadRequestException('Body is required');
    }
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
