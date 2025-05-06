import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CodeController } from './code/code.controller';
import { CodeService } from './code/code.service';

@Module({
  imports: [],
  controllers: [AppController, CodeController],
  providers: [AppService, CodeService],
})
export class AppModule {}
