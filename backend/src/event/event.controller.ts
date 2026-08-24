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

  @Get('owned')
  @ApiOkResponse({ type: EventResponseDto, isArray: true })
  getMyEvents(@Req() req: Request) {
    return this.eventsService.getMyEvents(req.user);
  }

  @Get('joined')
  @ApiOkResponse({ type: EventResponseDto, isArray: true })
  getJoinedEvents(@Req() req: Request) {
    return this.eventsService.getJoinedEvents(req.user);
  }

  @Get(':eventId')
  @ApiOkResponse({ type: EventResponseDto })
  getEvent(@Param('eventId') eventId: string, @Req() req: Request) {
    return this.eventsService.getEvent(req.user, eventId);
  }

  // ─── MUTATIONS ────────────────────────────────────────────────────────────

  @Post()
  @ApiCreatedResponse({ type: EventResponseDto })
  createEvent(@Req() req: Request, @Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(req.user, dto);
  }

  @Patch(':eventId')
  @ApiOkResponse({ type: EventResponseDto })
  updateEvent(
    @Param('eventId') eventId: string,
    @Req() req: Request,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(req.user, eventId, dto);
  }

  @Post(':eventId/invite-code')
  @ApiOkResponse({ type: EventResponseDto })
  regenerateInviteCode(@Param('eventId') eventId: string, @Req() req: Request) {
    return this.eventsService.regenerateInviteCode(req.user, eventId);
  }

  @Delete(':eventId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: EventResponseDto })
  deleteEvent(@Param('eventId') eventId: string, @Req() req: Request) {
    return this.eventsService.deleteEvent(req.user, eventId);
  }

  // ─── MEMBERSHIP ───────────────────────────────────────────────────────────
}
