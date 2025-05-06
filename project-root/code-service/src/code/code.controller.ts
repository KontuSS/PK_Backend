import { Controller } from '@nestjs/common';

@Controller('code')
export class CodeController {
  constructor(private readonly codeService: CodeService) {}

  @Post('submit')
  submit(@Body() dto: any) {
    return this.codeService.submitCode(dto);
  }
}