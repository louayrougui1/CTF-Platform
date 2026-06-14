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
import { AddAdminDto } from './dto/addAdmin.dto';
import { RemoveAdminDto } from './dto/removeAdmin.dto';
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

  @Get(':id/members')
  getEventMembers(@Param('id') id: string) {
    return this.eventsService.getEventMembers(id);
  }

  @Get(':id/teams')
  getEventTeams(@Param('id') id: string) {
    return this.eventsService.getEventTeams(id);
  }

  @Get(':id/leaderboard')
  getEventLeaderboard(@Param('id') id: string) {
    return this.eventsService.getEventLeaderboard(id);
  }

  @Get(':id/stats')
  getEventStats(@Param('id') id: string) {
    return this.eventsService.getEventStats(id);
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

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  joinEvent(@Param('id') eventId: string, @Req() req: Request) {
    return this.eventsService.joinEvent(req.user, eventId);
  }

  @Delete(':id/leave')
  @HttpCode(HttpStatus.OK)
  leaveEvent(@Param('id') eventId: string, @Req() req: Request) {
    return this.eventsService.leaveEvent(req.user, eventId);
  }

  // ─── ADMIN ROLE MANAGEMENT ────────────────────────────────────────────────

  // Using POST/DELETE on a sub-resource rather than a PATCH on the member,
  // since the intent (promote/demote) is more explicit this way.

  @Post('admins')
  addEventAdmin(@Req() req: Request, @Body() dto: AddAdminDto) {
    return this.eventsService.addEventAdmin(req.user, dto);
  }

  @Delete('admins')
  @HttpCode(HttpStatus.OK)
  removeEventAdmin(@Req() req: Request, @Body() dto: RemoveAdminDto) {
    return this.eventsService.removeEventAdmin(req.user, dto);
  }
}
