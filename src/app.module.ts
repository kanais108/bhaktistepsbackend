import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthzModule } from './authz/authz.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TemplesModule } from './temples/temples.module';
import { EventsModule } from './events/events.module';
import { GroupsModule } from './groups/groups.module';
import { AttendanceModule } from './attendance/attendance.module';
import { SadhanaModule } from './sadhana/sadhana.module';
import { GroupMembersModule } from './group-members/group-members.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthzModule,
    AuthModule,
    UsersModule,
    TemplesModule,
    EventsModule,
    GroupsModule,
    AttendanceModule,
    SadhanaModule,
    GroupMembersModule,
    AdminModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
