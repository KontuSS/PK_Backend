import { Controller } from '@nestjs/common';

@Controller('plagiarism')
export class PlagiarismController {
  constructor(private readonly plagiarismService: PlagiarismService) {}

  @Post('check')
  check(@Body() body: { codeA: string, codeB: string }) {
    const score = this.plagiarismService.checkSimilarity(body.codeA, body.codeB);
    return { similarity: score };
  }
}