import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async requestOtp(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.prisma.emailOtp.deleteMany({
      where: { email: normalizedEmail },
    });

    const otp = this.generateOtp();

    await this.prisma.emailOtp.create({
      data: {
        email: normalizedEmail,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    const from = process.env.RESEND_FROM_EMAIL;
    if (!from) {
      throw new InternalServerErrorException(
        'RESEND_FROM_EMAIL is not configured',
      );
    }

    const { error } = await this.resend.emails.send({
      from,
      to: normalizedEmail,
      subject: 'Your Bhakti Steps login OTP',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Bhakti Steps Login OTP</h2>
          <p>Your one-time password is:</p>
          <div style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 16px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 5 minutes.</p>
          <p>If you did not request this, you can ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend send error:', error);
      throw new InternalServerErrorException('Failed to send OTP email');
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email: string, otp: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const record = await this.prisma.emailOtp.findFirst({
      where: {
        email: normalizedEmail,
        otp: otp.trim(),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const token = this.jwtService.sign({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    return {
      token,
      user,
    };
  }
}
