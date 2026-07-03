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
import { ChallengeService } from './challenge.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CreateChallengeDto } from './dto/challengeCreate.dto';
import { UpdateChallengeDto } from './dto/updateChallenge.dto';
import { SubmitFlagDto } from './dto/submitFlag.dto';
import type { Request } from 'express';

@Controller('events/:eventId/challenges')
@UseGuards(JwtGuard)
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  // ─── QUERIES ────────────────────────────────────────────────────────────────

  @Get()
  getChallengesByEvent(@Param('eventId') eventId: string) {
    return this.challengeService.getChallengesByEvent(eventId);
  }

  @Get(':id')
  getChallenge(@Param('id') id: string) {
    return this.challengeService.getChallenge(id);
  }

  @Get(':id/stats')
  getChallengeStats(@Param('id') id: string) {
    return this.challengeService.getChallengeStats(id);
  }

  // ─── MUTATIONS ──────────────────────────────────────────────────────────────

  @Post()
  createChallenge(
    @Param('eventId') eventId: string,
    @Req() req: Request,
    @Body() dto: CreateChallengeDto,
  ) {
    return this.challengeService.createChallenge(req.user, eventId, dto);
  }

  @Patch(':id')
  updateChallenge(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateChallengeDto,
  ) {
    return this.challengeService.updateChallenge(req.user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteChallenge(@Param('id') id: string, @Req() req: Request) {
    return this.challengeService.deleteChallenge(req.user, id);
  }

  // sumbission of flag

  @Post(':id/submit')
  submitFlag(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: SubmitFlagDto,
  ) {
    return this.challengeService.submitFlag(req.user, id, dto);
  }
}
