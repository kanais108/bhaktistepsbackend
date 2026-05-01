import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as admin from 'firebase-admin';

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

      const serviceAccount = JSON.parse(raw);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  }

  async sendTestToMe(userId: string) {
    const tokens = await this.prisma.deviceToken.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        token: true,
      },
    });

    if (tokens.length === 0) {
      return {
        success: false,
        message: 'No active device tokens found for this user',
      };
    }

    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokens.map((t) => t.token),
      notification: {
        title: 'Hare Krishna 🙏',
        body: 'This is your first Bhakti Steps push notification.',
      },
      data: {
        type: 'test',
      },
    });

    return {
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
    };
  }
}
