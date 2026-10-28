import { Module } from '@nestjs/common';
import { ORPCModule } from '@orpc/nest';
import { ORPCError } from '@orpc/server';
import { experimental_RethrowHandlerPlugin } from '@orpc/server/plugins';
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
import { CalendarModule } from './calendar/calendar.module';
import { TtsModule } from './tts/tts.module';

@Module({
  imports: [
    ORPCModule.forRoot({
      plugins: [
        new experimental_RethrowHandlerPlugin({
          // Let Nest's global exception filter log unexpected failures, while
          // retaining oRPC's normal typed error responses for expected errors.
          filter: (error) => !(error instanceof ORPCError),
        }),
      ],
    }),
    AuthModule.forRoot({ auth, disableGlobalAuthGuard: true }),
    DirectChatModule,
    SocketModule,
    PresenceModule,
    UsersModule,
    ApiKeysModule,
    CryptoModule,
    AgentModule,
    CalendarModule,
    TtsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
