import { Injectable } from '@nestjs/common';

@Injectable()
export class PlagiarismService {
  checkSimilarity(a: string, b: string): number {
    // bardzo uproszczone porównanie podobieństwa
    return a === b ? 100 : 42;
  }
}