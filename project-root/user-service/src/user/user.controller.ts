/* eslint-disable prettier/prettier */
import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  register(@Body() dto: any) {
    return this.userService.register(dto);
  }
}
