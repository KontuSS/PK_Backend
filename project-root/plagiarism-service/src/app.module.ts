import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PlagiarismController } from './plagiarism/plagiarism.controller';
import { PlagiarismService } from './plagiarism/plagiarism.service';

@Module({
  imports: [],
  controllers: [AppController, PlagiarismController],
  providers: [AppService, PlagiarismService],
})
export class AppModule {}
