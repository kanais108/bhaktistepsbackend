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

  async sendToMe(userId: string, title: string, body: string, type?: string) {
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId, isActive: true },
    });

    if (!tokens.length) {
      return { success: false, message: 'No tokens found' };
    }

    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokens.map((t) => t.token),
      notification: {
        title,
        body,
      },
      data: {
        type: type ?? 'dashboard', // important
      },
    });

    return {
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
    };
  }
}
