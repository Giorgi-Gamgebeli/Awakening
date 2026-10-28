import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import type { Response } from 'express';
import { z } from '@repo/zod';
import { edgeTtsVoiceIds, geminiTtsVoiceIds, TtsService } from './tts.service';

const edgeTtsRequestSchema = z.object({
  text: z.string().trim().min(1).max(20000),
  voice: z.enum(edgeTtsVoiceIds),
});

const geminiTtsRequestSchema = z.object({
  text: z.string().trim().min(1).max(20000),
  voice: z.enum(geminiTtsVoiceIds),
});

@UseGuards(AuthGuard)
@Controller('tts')
export class TtsController {
  constructor(private readonly ttsService: TtsService) {}

  @Post('edge')
  async edge(@Body() body: unknown, @Res() response: Response) {
    const parsed = edgeTtsRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('Provide text and a supported voice.');
    }

    const audio = await this.ttsService.synthesize(
      parsed.data.text,
      parsed.data.voice,
    );

    response.setHeader('Content-Type', 'audio/mpeg');
    response.setHeader('Content-Length', audio.byteLength);
    response.setHeader('Cache-Control', 'no-store');
    response.end(audio);
  }

  @Post('gemini')
  async gemini(
    @Body() body: unknown,
    @Session() session: UserSession,
    @Res() response: Response,
  ) {
    const parsed = geminiTtsRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('Provide text and a supported voice.');
    }

    const { audio, mimeType } = await this.ttsService.synthesizeGemini(
      parsed.data.text,
      parsed.data.voice,
      session.user.id,
    );

    response.setHeader('Content-Type', mimeType);
    response.setHeader('Content-Length', audio.byteLength);
    response.setHeader('Cache-Control', 'no-store');
    response.end(audio);
  }
}
