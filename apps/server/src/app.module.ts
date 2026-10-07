import { Module } from '@nestjs/common';
import { ORPCModule } from '@orpc/nest';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { auth } from './auth/auth';
import { DirectChatModule } from './direct-chat/direct-chat.module';
import { SocketModule } from './socket/socket.module';
import { PresenceModule } from './presence/presence.module';
import { UsersModule } from './users/users.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { CryptoModule } from './crypto/crypto.module';
import { AgentModule } from './agent/agent.module';

@Module({
  imports: [
    ORPCModule.forRoot({}),
    AuthModule.forRoot({ auth, disableGlobalAuthGuard: true }),
    DirectChatModule,
    SocketModule,
    PresenceModule,
    UsersModule,
    ApiKeysModule,
    CryptoModule,
    AgentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
