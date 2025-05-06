/* eslint-disable prettier/prettier */
import { Controller } from '@nestjs/common';

@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  findMatch(@Body() user: any) {
    return this.matchService.matchUsers(user);
  }
}