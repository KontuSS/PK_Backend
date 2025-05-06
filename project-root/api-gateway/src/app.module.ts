import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppController } from './app/app.controller';

import { HttpModule } from '@nestjs/axios';
@Module({ imports: [HttpModule] })

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
