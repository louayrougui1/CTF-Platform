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
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { EventResponseDto } from './dto/event-response.dto';
import { EventStatsResponseDto } from './dto/event-stats-response.dto';

@Controller('events')
@ApiBearerAuth()
@UseGuards(JwtGuard)
export class EventController {
  constructor(private readonly eventsService: EventService) {}

  @Get('stats/:eventId')
  @ApiOkResponse({ type: EventStatsResponseDto })
  getEventStats(@Param('eventId') eventId: string, @Req() req: Request) {
    return this.eventsService.getEventStats(req.user, eventId);
  }

  @Get()
  @ApiOkResponse({ type: EventResponseDto, isArray: true })
  getActiveEvents() {
    return this.eventsService.getActiveEvents();
  }

  @Get('mine')
  @ApiOkResponse({ type: EventResponseDto, isArray: true })
  getMyEvents(@Req() req: Request) {
    return this.eventsService.getMyEvents(req.user);
  }

  @Get(':id')
  @ApiOkResponse({ type: EventResponseDto })
  getEvent(@Param('id') id: string, @Req() req: Request) {
    return this.eventsService.getEvent(req.user, id);
  }

  // ─── MUTATIONS ────────────────────────────────────────────────────────────

  @Post()
  @ApiCreatedResponse({ type: EventResponseDto })
  createEvent(@Req() req: Request, @Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(req.user, dto);
  }

  @Patch(':id')
  @ApiOkResponse({ type: EventResponseDto })
  updateEvent(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(req.user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: EventResponseDto })
  deleteEvent(@Param('id') id: string, @Req() req: Request) {
    return this.eventsService.deleteEvent(req.user, id);
  }

  // ─── MEMBERSHIP ───────────────────────────────────────────────────────────
}
