/* eslint-disable prettier/prettier */
import { Controller, Body, Post } from '@nestjs/common';
import { MatchService } from './match.service';

@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  findMatch(@Body() user: any) {
    return this.matchService.matchUsers(user);
  }
}