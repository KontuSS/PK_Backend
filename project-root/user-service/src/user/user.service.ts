/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  register(dto: any) {
    // tutaj logika rejestracji, np. zapis do bazy
    return { message: 'User registered', data: dto };
  }
}