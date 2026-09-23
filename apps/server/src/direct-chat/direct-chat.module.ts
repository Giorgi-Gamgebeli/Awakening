import { Module } from '@nestjs/common';
import { DirectChatService } from './direct-chat.service';
import { DirectChatGateway } from './direct-chat.gateway';

@Module({
  providers: [DirectChatGateway, DirectChatService],
})
export class DirectChatModule {}
