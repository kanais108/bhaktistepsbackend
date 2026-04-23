import { Module } from '@nestjs/common';
import { TemplesService } from './temples.service';
import { TemplesController } from './temples.controller';

@Module({
  providers: [TemplesService],
  controllers: [TemplesController]
})
export class TemplesModule {}
