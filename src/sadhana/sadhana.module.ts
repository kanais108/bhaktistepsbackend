import { Module } from '@nestjs/common';
import { SadhanaController } from './sadhana.controller';
import { SadhanaService } from './sadhana.service';

@Module({
  controllers: [SadhanaController],
  providers: [SadhanaService],
})
export class SadhanaModule {}
