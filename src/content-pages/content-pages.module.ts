import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ContentPagesController } from './content-pages.controller';
import { ContentPagesService } from './content-pages.service';

@Module({
  imports: [PrismaModule],
  controllers: [ContentPagesController],
  providers: [ContentPagesService],
})
export class ContentPagesModule {}
