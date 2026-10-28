import { Injectable, Logger } from '@nestjs/common';
import {
  agentChatInputSchema,
  agentChatOutputSchema,
  agentModelsInputSchema,
  agentModelsOutputSchema,
  ApiKeysProviderSchema,
  ApiKeysCheckAvailabilityInputSchema,
  ApiKeysReasoningEffortSchema,
  z,
} from '@repo/zod';
import { db } from '@repo/db';
import { ORPCError } from '@orpc/server';
import { APICallError } from 'ai';
import { CryptoService } from '../crypto/crypto.service';
import { CalendarService } from '../calendar/calendar.service';
import { AgentProviderRegistry } from './providers/agent-provider-registry.service';
import { createCalendarTools } from './calendar-tools';

const MODELS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MODELS_CACHE_VERSION = 5;

const modelsCacheSchema = z.object({
  version: z.literal(MODELS_CACHE_VERSION),
  models: agentModelsOutputSchema,
});

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly cryptoService: CryptoService,
    private readonly agentProviderRegistry: AgentProviderRegistry,
    private readonly calendarService: CalendarService,
  ) {}

  private async getAgentProvider(apiKeyId: number, userId: string) {
    const encryptedApiKey = await db.userApiKeys.findFirst({
      where: {
        id: apiKeyId,
        userId,
      },
      select: {
        id: true,
        key: true,
        provider: true,
        availableModels: true,
        modelsUpdatedAt: true,
        reasoningEffort: true,
      },
    });

    if (!encryptedApiKey)
      throw new ORPCError('NOT_FOUND', {
        message: 'Add an API key in Settings first.',
      });

    const providerResult = ApiKeysProviderSchema.safeParse(
      encryptedApiKey.provider,
    );

    if (!providerResult.success) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'The saved API key has an unsupported provider.',
      });
    }

    return {
      id: encryptedApiKey.id,
      apiKey: this.cryptoService.decrypt(encryptedApiKey.key),
      provider: this.agentProviderRegistry.get(providerResult.data),
      availableModels: encryptedApiKey.availableModels,
      modelsUpdatedAt: encryptedApiKey.modelsUpdatedAt,
      reasoningEffort: encryptedApiKey.reasoningEffort,
    };
  }

  private getCachedModels(
    availableModels: unknown,
    modelsUpdatedAt: Date | null,
  ): z.infer<typeof agentModelsOutputSchema> | null {
    if (
      !modelsUpdatedAt ||
      Date.now() - modelsUpdatedAt.getTime() >= MODELS_CACHE_TTL_MS
    ) {
      return null;
    }

    const parsed = modelsCacheSchema.safeParse(availableModels);
    return parsed.success ? parsed.data.models : null;
  }

  private async refreshModels(
    agentKey: Awaited<ReturnType<AgentService['getAgentProvider']>>,
    userId: string,
  ): Promise<z.infer<typeof agentModelsOutputSchema>> {
    try {
      const models = await agentKey.provider.listModels(agentKey.apiKey);

      await db.userApiKeys.update({
        where: { id: agentKey.id },
        data: {
          availableModels: {
            version: MODELS_CACHE_VERSION,
            models,
          },
          modelsUpdatedAt: new Date(),
        },
      });

      return models;
    } catch (error) {
      this.logger.error(
        `AI model discovery failed: provider=${agentKey.provider.name}, userId=${userId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'The AI provider could not load its available models.',
      });
    }
  }

  async checkAvailability(
    { key, provider }: z.infer<typeof ApiKeysCheckAvailabilityInputSchema>,
    userId: string,
  ): Promise<z.infer<typeof agentModelsOutputSchema>> {
    try {
      return await this.agentProviderRegistry.get(provider).listModels(key);
    } catch (error) {
      this.logger.warn(
        `API key availability check failed: provider=${provider}, userId=${userId}`,
      );
      throw new ORPCError('BAD_REQUEST', {
        message: 'This API key could not load any available models.',
        cause: error,
      });
    }
  }

  private isModelUnavailableError(error: unknown) {
    if (!APICallError.isInstance(error)) return false;

    if (error.statusCode === 404) return true;

    return (
      error.statusCode === 400 &&
      /model.*(not found|does not exist|unavailable)/i.test(
        `${error.message} ${error.responseBody ?? ''}`,
      )
    );
  }

  async models(
    { apiKeyId }: z.infer<typeof agentModelsInputSchema>,
    userId: string,
  ): Promise<z.infer<typeof agentModelsOutputSchema>> {
    const agentKey = await this.getAgentProvider(apiKeyId, userId);
    const cachedModels = this.getCachedModels(
      agentKey.availableModels,
      agentKey.modelsUpdatedAt,
    );

    return cachedModels ?? this.refreshModels(agentKey, userId);
  }

  private resolveTimeZone(timeZone: string | undefined): string {
    const fallback = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    if (!timeZone) return fallback;

    try {
      new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
      return timeZone;
    } catch {
      return fallback;
    }
  }

  private buildSystemPrompt(timeZone: string): string {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);

    const value = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? '';
    const localDate = `${value('year')}-${value('month')}-${value('day')}`;

    return [
      "You are the user's personal assistant with access to their Calendar.",
      `The user's time zone is ${timeZone}.`,
      `The current local date is ${localDate} (${value('weekday')}).`,
      `The current local time is ${value('hour')}:${value('minute')}.`,
      'Interpret relative dates and times such as "tomorrow at 7pm" against this local date and time.',
      'When the user asks to add, schedule, or change something, call create_calendar_event.',
      'To move, reschedule, rename, or otherwise edit an event, first call list_calendar_events to find its id, then call update_calendar_event with that id and only the fields that change.',
      'When moving an event to another date and no new time is given, pass only the new date so the existing local time is kept. Never invent a calendar event id.',
      'Always pass dates as YYYY-MM-DD and times as 24-hour HH:mm in the user time zone.',
      'When no end time is given, the event lasts one hour. When no title is given, use a short sensible title such as "Event".',
      'After the tool succeeds, confirm briefly with the title and the local date and time.',
      'Only say an event was added or changed if the tool succeeded. If the user asks about their schedule, use list_calendar_events.',
    ].join('\n');
  }

  async chat(
    {
      text,
      apiKeyId,
      model,
      sessionId,
      timeZone,
    }: z.infer<typeof agentChatInputSchema>,
    userId: string,
  ): Promise<z.infer<typeof agentChatOutputSchema>> {
    const agentKey = await this.getAgentProvider(apiKeyId, userId);
    const models =
      this.getCachedModels(
        agentKey.availableModels,
        agentKey.modelsUpdatedAt,
      ) ?? (await this.refreshModels(agentKey, userId));

    if (!models.some((availableModel) => availableModel.id === model)) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'This model is not available for the selected API key.',
      });
    }

    // Resolve (or auto-create) the session first so every turn is durable.
    // Every query is scoped by userId: a session id alone never grants access.
    const session = await this.resolveSession(
      sessionId,
      userId,
      apiKeyId,
      model,
      agentKey.provider.name,
      text,
    );

    const userMessage = await this.appendMessage(
      session.id,
      'USER',
      text,
      null,
    );

    // Context assembly seam: stateless providers still get continuity by
    // stitching the recent transcript into a single prompt. Swap this for
    // native message-array calls when providers support it.
    const history = await this.loadHistory(session.id);
    const prompt = this.buildPrompt(history, text);

    const resolvedTimeZone = this.resolveTimeZone(timeZone);
    const tools = createCalendarTools(
      this.calendarService,
      userId,
      resolvedTimeZone,
    );
    const system = this.buildSystemPrompt(resolvedTimeZone);

    try {
      const reasoningEffort =
        ApiKeysReasoningEffortSchema.safeParse(agentKey.reasoningEffort);
      const requestedReasoningEffort =
        reasoningEffort.success && reasoningEffort.data !== 'default'
          ? reasoningEffort.data
          : null;

      const result = await agentKey.provider.chat({
        apiKey: agentKey.apiKey,
        text: prompt,
        model,
        reasoningEffort: requestedReasoningEffort,
        system,
        tools,
      });

      if (result.status !== 'success') {
        this.logger.warn(
          `AI result ${result.status}: provider=${agentKey.provider.name}, model=${model}, reason=${result.reason}, userId=${userId}`,
        );
      }

      const assistantText =
        result.status === 'success' ? result.text : result.message;
      const assistantMessage = await this.appendMessage(
        session.id,
        'AGENT',
        assistantText,
        model,
      );
      await this.touchSession(session.id, apiKeyId, model);

      return {
        ...result,
        sessionId: session.id,
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
      };
    } catch (error) {
      if (this.isModelUnavailableError(error)) {
        await this.refreshModels(agentKey, userId);
        throw new ORPCError('BAD_REQUEST', {
          message: 'This model is no longer available. Choose another model.',
        });
      }

      if (APICallError.isInstance(error) && error.statusCode === 429) {
        this.logger.warn(
          `AI provider rate limit hit: provider=${agentKey.provider.name}, model=${model}, userId=${userId}`,
        );
        throw new ORPCError('TOO_MANY_REQUESTS', {
          message:
            'The AI provider is rate limited or out of quota. Wait a moment, enable billing, or switch to another API key.',
        });
      }

      this.logger.error(
        `AI request failed: provider=${agentKey.provider.name}, userId=${userId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'The AI provider could not complete the request.',
      });
    }
  }

  private async resolveSession(
    sessionId: string | undefined,
    userId: string,
    apiKeyId: number,
    model: string,
    provider: string,
    firstText: string,
  ) {
    if (sessionId) {
      const existing = await db.agentSession.findFirst({
        where: { id: sessionId, userId },
        select: { id: true },
      });
      if (!existing) {
        throw new ORPCError('NOT_FOUND', { message: 'Chat not found.' });
      }
      return existing;
    }

    const title =
      firstText.replace(/\s+/g, ' ').trim().slice(0, 57) +
      (firstText.trim().length > 57 ? '...' : '');

    return await db.agentSession.create({
      data: {
        userId,
        apiKeyId,
        title: title || 'New chat',
        model,
        provider: provider as never,
      },
      select: { id: true },
    });
  }

  private async appendMessage(
    sessionId: string,
    role: 'USER' | 'AGENT' | 'SYSTEM',
    content: string,
    model: string | null,
  ) {
    // Append-only writes with optimistic concurrency: the UNIQUE(sessionId, sequence)
    // constraint rejects interleaved writes from two tabs; retry picks the next sequence.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const last = await db.agentMessage.findFirst({
        where: { sessionId },
        orderBy: { sequence: 'desc' },
        select: { sequence: true },
      });
      const sequence = (last?.sequence ?? -1) + 1;
      try {
        const created = await db.agentMessage.create({
          data: { sessionId, sequence, role, content, model },
          select: { id: true, sequence: true },
        });
        return created;
      } catch (error) {
        const isUniqueConflict =
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code?: string }).code === 'P2002';
        if (!isUniqueConflict || attempt === 2) throw error;
      }
    }
    throw new ORPCError('CONFLICT', {
      message: 'Message conflict. Reload the chat and retry.',
    });
  }

  private async loadHistory(sessionId: string, limit = 20) {
    const rows = await db.agentMessage.findMany({
      where: { sessionId },
      orderBy: { sequence: 'desc' },
      take: limit,
      select: { role: true, content: true },
    });
    return [...rows].reverse();
  }

  private buildPrompt(
    history: Array<{ role: string; content: string }>,
    currentText: string,
  ): string {
    // Exclude the just-saved user turn (last entry) to avoid duplication.
    const prior = history.slice(0, -1).slice(-10);
    if (prior.length === 0) return currentText;
    const transcript = prior
      .map((m) => `${m.role === 'USER' ? 'User' : 'Agent'}: ${m.content}`)
      .join('\n');
    return `Previous conversation:\n${transcript}\n\nCurrent message: ${currentText}`;
  }

  private async touchSession(sessionId: string, apiKeyId: number, model: string) {
    await db.agentSession.update({
      where: { id: sessionId },
      data: { lastMessageAt: new Date(), apiKeyId, model },
    });
  }
}
