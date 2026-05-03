import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as admin from 'firebase-admin';

type SendNotificationParams = {
  title: string;
  body: string;
  type?: string;
  audience?: 'all' | 'role' | 'group';
  role?: string;
  groupId?: string;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {
    if (!admin.apps.length) {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

      if (!raw) {
        throw new InternalServerErrorException(
          'FIREBASE_SERVICE_ACCOUNT_JSON is not configured',
        );
      }

      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(raw)),
      });
    }
  }

  async send(params: SendNotificationParams) {
    const audience = params.audience ?? 'all';

    const where: any = {
      isActive: true,
    };

    if (audience === 'role' && params.role) {
      where.user = {
        role: params.role,
      };
    }

    if (audience === 'group' && params.groupId) {
      where.user = {
        groupMemberships: {
          some: {
            groupId: params.groupId,
          },
        },
      };
    }

    const tokens = await this.prisma.deviceToken.findMany({
      where,
      select: {
        token: true,
      },
    });

    if (tokens.length === 0) {
      return {
        success: false,
        message: 'No active device tokens found',
        sent: 0,
        failed: 0,
      };
    }

    let sent = 0;
    let failed = 0;

    const tokenValues = tokens.map((t) => t.token);

    for (let i = 0; i < tokenValues.length; i += 500) {
      const batch = tokenValues.slice(i, i + 500);

      const response = await admin.messaging().sendEachForMulticast({
        tokens: batch,
        notification: {
          title: params.title,
          body: params.body,
        },
        data: {
          type: params.type ?? 'dashboard',
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      });

      sent += response.successCount;
      failed += response.failureCount;
    }

    return {
      success: true,
      audience,
      totalTokens: tokens.length,
      sent,
      failed,
    };
  }
}
