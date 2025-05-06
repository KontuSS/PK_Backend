/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';

@Injectable()
export class MatchService {
  matchUsers(user: any) {
    return { matched: ['user123', 'user456'] };
  }
}