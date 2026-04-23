import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Event } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
    role: string;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @UseGuards(RolesGuard)
  @Roles('SERVANT_LEADER', 'SECTOR_LEADER', 'CIRCLE_LEADER', 'SUPER_ADMIN')
  @Post()
  create(
    @Body() createEventDto: CreateEventDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Event> {
    return this.eventsService.create({
      ...createEventDto,
      startsAt: new Date(createEventDto.startsAt),
      endsAt: new Date(createEventDto.endsAt),
      createdByUserId: req.user.userId,
    });
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest): Promise<Event[]> {
    return this.eventsService.findAllScoped(req.user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles('SERVANT_LEADER', 'SECTOR_LEADER', 'CIRCLE_LEADER', 'SUPER_ADMIN')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.eventsService.update(id, req.user.userId, {
      ...updateEventDto,
      startsAt: updateEventDto.startsAt
        ? new Date(updateEventDto.startsAt)
        : undefined,
      endsAt: updateEventDto.endsAt
        ? new Date(updateEventDto.endsAt)
        : undefined,
    });
  }

  @UseGuards(RolesGuard)
  @Roles('SERVANT_LEADER', 'SECTOR_LEADER', 'CIRCLE_LEADER', 'SUPER_ADMIN')
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.eventsService.deactivate(id, req.user.userId);
  }
}
