import {
  Controller,
  Get,
  Post,
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
import { JoinEventDto } from './dto/joinEvent.dto';
import type { Request } from 'express';
import { EventMemberService } from './event-member.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { EventMemberResponseDto } from './dto/event-member-response.dto';
import { EventMemberScalarResponseDto } from './dto/event-member-scalar-response.dto';

@UseGuards(JwtGuard)
@Controller('event-member')
@ApiBearerAuth()
export class EventMemberController {
  constructor(private readonly eventMemberService: EventMemberService) {}

  @Get(':eventId/members')
  @ApiOkResponse({ type: EventMemberResponseDto, isArray: true })
  getEventMembers(@Param('eventId') eventId: string, @Req() req: Request) {
    return this.eventMemberService.getEventMembers(req.user, eventId);
  }

  @Post('join-by-code')
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({ type: EventMemberScalarResponseDto })
  joinEventByCode(@Req() req: Request, @Body() dto: JoinEventDto) {
    return this.eventMemberService.joinEventByCode(req.user, dto);
  }

  @Post(':eventId/join')
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({ type: EventMemberScalarResponseDto })
  joinEvent(@Param('eventId') eventId: string, @Req() req: Request) {
    return this.eventMemberService.joinEvent(req.user, eventId);
  }

  @Delete(':eventId/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: EventMemberScalarResponseDto })
  leaveEvent(@Param('eventId') eventId: string, @Req() req: Request) {
    return this.eventMemberService.leaveEvent(req.user, eventId);
  }

  @Post('admins')
  @ApiOkResponse({ type: EventMemberScalarResponseDto })
  addEventAdmin(@Req() req: Request, @Body() dto: AddAdminDto) {
    return this.eventMemberService.addEventAdmin(req.user, dto);
  }

  @Delete('admins')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: EventMemberScalarResponseDto })
  removeEventAdmin(@Req() req: Request, @Body() dto: RemoveAdminDto) {
    return this.eventMemberService.removeEventAdmin(req.user, dto);
  }
}
