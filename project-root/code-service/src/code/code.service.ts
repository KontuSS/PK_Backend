import { Injectable } from '@nestjs/common';

@Injectable()
export class CodeService {
  submitCode(dto: any) {
    return { success: true, submittedCode: dto.code };
  }
}