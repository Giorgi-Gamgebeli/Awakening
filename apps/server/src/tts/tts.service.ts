import {
  BadGatewayException,
  HttpException,
  Injectable,
  Logger,
  PreconditionFailedException,
} from '@nestjs/common';
import { db } from '@repo/db';
import { z } from '@repo/zod';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { CryptoService } from '../crypto/crypto.service';

export const edgeTtsVoiceIds = [
  'ka-GE-EkaNeural',
  'ka-GE-GiorgiNeural',
] as const;

export type EdgeTtsVoice = (typeof edgeTtsVoiceIds)[number];

export const geminiTtsVoiceIds = ['Kore', 'Charon', 'Aoede', 'Puck'] as const;

export type GeminiTtsVoice = (typeof geminiTtsVoiceIds)[number];

const geminiTtsUrl =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent';

const geminiTtsResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z
          .object({
            parts: z
              .array(
                z.object({
                  inlineData: z
                    .object({
                      data: z.string().min(1),
                      mimeType: z.string().optional(),
                    })
                    .optional(),
                }),
              )
              .default([]),
          })
          .optional(),
        finishReason: z.string().optional(),
      }),
    )
    .default([]),
  promptFeedback: z
    .object({
      blockReason: z.string().optional(),
    })
    .optional(),
});

const xmlEscapes: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (char) => xmlEscapes[char] ?? char);
}

function hasWavHeader(audio: Buffer) {
  return (
    audio.length >= 12 &&
    audio.toString('ascii', 0, 4) === 'RIFF' &&
    audio.toString('ascii', 8, 12) === 'WAVE'
  );
}

function pcmToWav(
  pcm: Buffer,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16,
) {
  const header = Buffer.alloc(44);
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;

  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + pcm.byteLength, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(pcm.byteLength, 40);

  return Buffer.concat([header, pcm]);
}

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  constructor(private readonly cryptoService: CryptoService) {}

  async synthesize(text: string, voice: EdgeTtsVoice): Promise<Buffer> {
    const tts = new MsEdgeTTS({
      connectionTimeoutMs: 15000,
      synthesisTimeoutMs: 60000,
    });

    try {
      await tts.setMetadata(
        voice,
        OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
      );
      const { audioStream } = tts.toStream(escapeXml(text));
      const chunks: Buffer[] = [];

      for await (const chunk of audioStream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      const audio = Buffer.concat(chunks);
      if (audio.length === 0) {
        throw new BadGatewayException('The speech service returned no audio.');
      }

      return audio;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(
        `Edge TTS failed for ${voice}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new BadGatewayException(
        'Could not generate speech. Please try again.',
      );
    } finally {
      try {
        tts.close();
      } catch {
        // The socket may already be closed after a failed synthesis.
      }
    }
  }

  async synthesizeGemini(
    text: string,
    voice: GeminiTtsVoice,
    userId: string,
  ): Promise<{ audio: Buffer; mimeType: string }> {
    const storedKey = await db.userApiKeys.findFirst({
      where: { userId, provider: 'GEMINI' },
      orderBy: [{ isActive: 'desc' }, { id: 'asc' }],
      select: { key: true },
    });

    if (!storedKey) {
      throw new PreconditionFailedException(
        'Add a Gemini API key in Settings to use Google voices.',
      );
    }

    const apiKey = this.cryptoService.decrypt(storedKey.key);

    try {
      const response = await fetch(geminiTtsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text }],
            },
          ],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { voice },
            },
          },
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        const details = await response
          .json()
          .then((body: unknown) => {
            if (
              typeof body === 'object' &&
              body !== null &&
              'error' in body &&
              typeof body.error === 'object' &&
              body.error !== null &&
              'message' in body.error &&
              typeof body.error.message === 'string'
            ) {
              return body.error.message;
            }
            return '';
          })
          .catch(() => '');

        this.logger.error(
          `Gemini TTS failed for ${voice}: status=${response.status}${
            details ? ` message=${details.slice(0, 200)}` : ''
          }`,
        );
        throw new BadGatewayException(
          response.status === 429
            ? 'The Google voice is rate limited or out of quota. Try again shortly.'
            : response.status === 401 || response.status === 403
              ? 'Google rejected this API key. Check the Gemini key in Settings.'
              : 'Google could not generate speech. Please try again.',
        );
      }

      const parsed = geminiTtsResponseSchema.safeParse(await response.json());

      if (!parsed.success) {
        throw new BadGatewayException(
          'Google returned an unexpected speech response.',
        );
      }

      const inlineData = parsed.data.candidates
        .flatMap((candidate) => candidate.content?.parts ?? [])
        .map((part) => part.inlineData)
        .find((part) => part?.data);

      if (!inlineData?.data) {
        const reason = parsed.data.promptFeedback?.blockReason;
        throw new BadGatewayException(
          reason
            ? `Google blocked this speech request (${reason}).`
            : 'Google returned no speech audio.',
        );
      }

      const audio = Buffer.from(inlineData.data, 'base64');
      if (audio.length === 0) {
        throw new BadGatewayException('Google returned no speech audio.');
      }

      const mimeType = inlineData.mimeType ?? 'audio/wav';
      const isWav =
        hasWavHeader(audio) || mimeType.toLowerCase().includes('wav');

      return {
        audio: isWav ? audio : pcmToWav(audio),
        mimeType: 'audio/wav',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(
        `Gemini TTS request failed for ${voice}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new BadGatewayException(
        'Could not generate speech with Google. Please try again.',
      );
    }
  }
}
