import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@Injectable()
export class DeviceTokensService {
  constructor(private readonly prisma: PrismaService) {}

  register(userId: string, dto: RegisterDeviceTokenDto) {
    return this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      update: {
        userId,
        platform: dto.platform,
        isActive: true,
      },
      create: {
        userId,
        token: dto.token,
        platform: dto.platform,
      },
    });
  }

  deactivate(token: string) {
    return this.prisma.deviceToken.updateMany({
      where: { token },
      data: { isActive: false },
    });
  }
}
