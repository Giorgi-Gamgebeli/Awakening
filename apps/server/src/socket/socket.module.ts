import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { SocketGateway } from './socket.gateway';
import { PresenceModule } from '../presence/presence.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PresenceModule, UsersModule],
  providers: [SocketGateway, SocketService],
})
export class SocketModule {}
