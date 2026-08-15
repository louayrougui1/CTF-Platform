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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChallengeService } from './challenge.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CreateChallengeDto } from './dto/challengeCreate.dto';
import { UpdateChallengeDto } from './dto/updateChallenge.dto';
import { SubmitFlagDto } from './dto/submitFlag.dto';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { ChallengeResponseDto } from './dto/challenge-response.dto';
import { ChallengeStatsResponseDto } from './dto/challenge-stats-response.dto';
import { SubmissionResponseDto } from './dto/submission-response.dto';

@Controller('events/:eventId/challenges')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  // ─── QUERIES ────────────────────────────────────────────────────────────────

  @Get()
  @ApiOkResponse({ type: ChallengeResponseDto, isArray: true })
  getChallengesByEvent(@Param('eventId') eventId: string, @Req() req: Request) {
    return this.challengeService.getChallengesByEvent(req.user, eventId);
  }

  @Get(':id')
  @ApiOkResponse({ type: ChallengeResponseDto })
  getChallenge(@Param('id') id: string, @Req() req: Request) {
    return this.challengeService.getChallenge(req.user, id);
  }

  @Get(':id/stats')
  @ApiOkResponse({ type: ChallengeStatsResponseDto })
  getChallengeStats(@Param('id') id: string, @Req() req: Request) {
    return this.challengeService.getChallengeStats(req.user, id);
  }

  // ─── MUTATIONS ──────────────────────────────────────────────────────────────
  @UseInterceptors(FileInterceptor('file'))
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        flag: { type: 'string' },
        category: {
          type: 'string',
          enum: [
            'WEB',
            'CRYPTO',
            'PWN',
            'REVERSE',
            'FORENSICS',
            'OSINT',
            'MISC',
          ],
        },
        difficulty: {
          type: 'string',
          enum: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'],
        },
        points: { type: 'number' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: ChallengeResponseDto })
  createChallenge(
    @Param('eventId') eventId: string,
    @Req() req: Request,
    @Body() dto: CreateChallengeDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.challengeService.createChallenge(req.user, eventId, dto, file);
  }

  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @Patch(':id')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        flag: { type: 'string' },
        category: {
          type: 'string',
          enum: [
            'WEB',
            'CRYPTO',
            'PWN',
            'REVERSE',
            'FORENSICS',
            'OSINT',
            'MISC',
          ],
        },
        difficulty: {
          type: 'string',
          enum: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'],
        },
        points: { type: 'number' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOkResponse({ type: ChallengeResponseDto })
  updateChallenge(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateChallengeDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.challengeService.updateChallenge(req.user, id, dto, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ChallengeResponseDto })
  deleteChallenge(@Param('id') id: string, @Req() req: Request) {
    return this.challengeService.deleteChallenge(req.user, id);
  }

  // sumbission of flag

  @Post(':id/submit')
  @ApiCreatedResponse({ type: SubmissionResponseDto })
  submitFlag(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: SubmitFlagDto,
  ) {
    return this.challengeService.submitFlag(req.user, id, dto);
  }
}
