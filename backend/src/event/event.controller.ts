import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Req,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EventService } from './event.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CreateEventDto } from './dto/eventCreate.dto';
import { UpdateEventDto } from './dto/updateEvent.dto';
import type { Request } from 'express';

@Controller('events')
@UseGuards(JwtGuard)
export class EventController {
  constructor(private readonly eventsService: EventService) {}

  @Get()
  getActiveEvents() {
    return this.eventsService.getActiveEvents();
  }

  @Get('mine')
  getMyEvents(@Req() req: Request) {
    return this.eventsService.getMyEvents(req.user);
  }

  @Get(':id')
  getEvent(@Param('id') id: string) {
    return this.eventsService.getEvent(id);
  }

  // ─── MUTATIONS ────────────────────────────────────────────────────────────

  @Post()
  createEvent(@Req() req: Request, @Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(req.user, dto);
  }

  @Patch(':id')
  updateEvent(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(req.user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteEvent(@Param('id') id: string, @Req() req: Request) {
    return this.eventsService.deleteEvent(req.user, id);
  }

  // ─── MEMBERSHIP ───────────────────────────────────────────────────────────
}
