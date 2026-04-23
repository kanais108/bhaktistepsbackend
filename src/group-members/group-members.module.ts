import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthzModule } from '../authz/authz.module';
import { GroupMembersController } from './group-members.controller';
import { GroupMembersService } from './group-members.service';

@Module({
  imports: [PrismaModule, AuthzModule],
  controllers: [GroupMembersController],
  providers: [GroupMembersService],
  exports: [GroupMembersService],
})
export class GroupMembersModule {}
