import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MatchController } from './match/match.controller';
import { MatchService } from './match/match.service';

@Module({
  imports: [],
  controllers: [AppController, MatchController],
  providers: [AppService, MatchService],
})
export class AppModule {}
