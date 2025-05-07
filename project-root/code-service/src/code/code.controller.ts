import { Controller, Body, Post } from '@nestjs/common';
import { CodeService } from './code.service';

@Controller('code')
export class CodeController {
  constructor(private readonly codeService: CodeService) {}

  @Post('submit')
  submit(@Body() dto: any) {
    return this.codeService.submitCode(dto);
  }
}