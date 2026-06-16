import { Controller } from '@nestjs/common';
import { TeamService } from './team.service';
import { Get, Param } from '@nestjs/common';
@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}
  @Get(':id/stats')
  getEventStats(@Param('id') id: string) {
    return this.teamService.getEventStats(id);
  }
}
