import { Module } from '@nestjs/common';
import { ORPCModule } from '@orpc/nest';
import { SuperTokensModule } from 'supertokens-nestjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { superTokensConfig } from './supertokens.config';

@Module({
  imports: [ORPCModule.forRoot({}), SuperTokensModule.forRoot(superTokensConfig)],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
