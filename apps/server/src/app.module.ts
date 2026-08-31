import { Module } from '@nestjs/common';
import { ORPCModule } from '@orpc/nest';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { auth } from './auth/auth';

@Module({
  imports: [
    ORPCModule.forRoot({}),
    AuthModule.forRoot({ auth, disableGlobalAuthGuard: true }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}