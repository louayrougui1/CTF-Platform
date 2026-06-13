import { Controller, Get, Req, Res, UseGuards, Param } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import type { Response, Request } from 'express';

@Controller('events')
@UseGuards(JwtGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  getActiveEvents(@Req() req: Request) {
    return this.eventsService.getActiveEvents();
  }

  @Get()
  getMyEvents(@Req() req: Request) {
    return this.eventsService.getMyEvents(req.user);
  }

  @Get(':id')
  getEvent(@Param('id') id: string, @Req() req: Request) {
    return this.eventsService.getEvent(id);
  }
}
