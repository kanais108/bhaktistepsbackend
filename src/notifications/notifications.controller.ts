import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
    role: string;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  sendNotification(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.notificationsService.send({
      title: body.title,
      body: body.body,
      type: body.type,
      imageUrl: body.imageUrl,
      eventId: body.eventId,
      audience: body.audience ?? 'all',
      role: body.role,
      groupId: body.groupId,
    });
  }
}
