import { Controller, Get, HttpService } from '@nestjs/common';

@Controller()
export class AppController {
  constructor(private readonly http: HttpService) {}

  @Get('ping-user')
  pingUserService() {
    return this.http.get('http://user-service:3000/users/ping').toPromise();
  }
}