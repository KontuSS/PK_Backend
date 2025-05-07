/* eslint-disable prettier/prettier */
import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';

@WebSocketGateway()
export class ChatGateway {
  @SubscribeMessage('message')
  handleMessage(@MessageBody() message: string): string {
    return `Received: ${message}`;
  }
}