import { Module } from '@nestjs/common';

import { ProgramAdminController } from './program-admin.controller';
import { ProgramAdminService } from './program-admin.service';

@Module({
  controllers: [ProgramAdminController],
  providers: [ProgramAdminService],
})
export class ProgramAdminModule {}
