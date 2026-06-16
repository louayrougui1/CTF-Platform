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
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AddAdminDto } from '../event-member/dto/addAdmin.dto';
import { RemoveAdminDto } from '../event-member/dto/removeAdmin.dto';
import type { Request } from 'express';
import { EventMemberService } from './event-member.service';

@UseGuards(JwtGuard)
@Controller('event-member')
export class EventMemberController {
  constructor(private readonly eventMemberService: EventMemberService) {}

  @Get(':id/members')
  getEventMembers(@Param('id') id: string) {
    return this.eventMemberService.getEventMembers(id);
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  joinEvent(@Param('id') eventId: string, @Req() req: Request) {
    return this.eventMemberService.joinEvent(req.user, eventId);
  }

  @Delete(':id/leave')
  @HttpCode(HttpStatus.OK)
  leaveEvent(@Param('id') eventId: string, @Req() req: Request) {
    return this.eventMemberService.leaveEvent(req.user, eventId);
  }

  @Post('admins')
  addEventAdmin(@Req() req: Request, @Body() dto: AddAdminDto) {
    return this.eventMemberService.addEventAdmin(req.user, dto);
  }

  @Delete('admins')
  @HttpCode(HttpStatus.OK)
  removeEventAdmin(@Req() req: Request, @Body() dto: RemoveAdminDto) {
    return this.eventMemberService.removeEventAdmin(req.user, dto);
  }
}
