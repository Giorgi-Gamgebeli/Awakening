import { Module } from '@nestjs/common';
import { CryptoModule } from '../crypto/crypto.module';
import { TtsController } from './tts.controller';
import { TtsService } from './tts.service';

@Module({
  imports: [CryptoModule],
  controllers: [TtsController],
  providers: [TtsService],
})
export class TtsModule {}
