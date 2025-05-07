import { Controller, Get } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs'; // Importujemy firstValueFrom, aby przekonwertować Observable na Promise

@Controller()
export class AppController {
  constructor(private readonly http: HttpService) {}

  @Get('ping-user')
  async pingUserService() {
    const response = await firstValueFrom(this.http.get('http://user-service:3000/users/ping'));
    return response.data;
  }
}