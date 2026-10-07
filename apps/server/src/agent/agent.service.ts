import { Injectable, Logger } from '@nestjs/common';
import {
  agentChatInputSchema,
  agentChatOutputSchema,
  agentModelsInputSchema,
  agentModelsOutputSchema,
  ApiKeysProviderSchema,
  z,
} from '@repo/zod';
import { db } from '@repo/db';
import { ORPCError } from '@orpc/server';
import { APICallError } from 'ai';
import { CryptoService } from '../crypto/crypto.service';
import { AgentProviderRegistry } from './providers/agent-provider-registry.service';

const MODELS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MODELS_CACHE_VERSION = 3;
const MODEL_PROBE_CONCURRENCY = 5;

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
  ) {}

  private async getAgentProvider(apiKeyId: number, userId: string) {
    const encryptedApiKey = await db.userApiKeys.findFirst({
      where: {
        id: apiKeyId,
        userId,
        purpose: 'AGENT',
      },
      select: {
        id: true,
        key: true,
        provider: true,
        availableModels: true,
        modelsUpdatedAt: true,
      },
    });

    if (!encryptedApiKey)
      throw new ORPCError('NOT_FOUND', {
        message: 'Add an agent API key in Settings first.',
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
    unavailableModelId?: string,
  ): Promise<z.infer<typeof agentModelsOutputSchema>> {
    try {
      const discoveredModels = await agentKey.provider.listModels(
        agentKey.apiKey,
      );
      const candidates = unavailableModelId
        ? discoveredModels.filter(({ id }) => id !== unavailableModelId)
        : discoveredModels;
      const models = await this.probeModels(agentKey, candidates, userId);

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

  /**
   * Provider list endpoints describe known models, not necessarily models this
   * API key is authorised to call. Probe each candidate with a two-token text
   * request and cache only the models that actually succeed.
   */
  private async probeModels(
    agentKey: Awaited<ReturnType<AgentService['getAgentProvider']>>,
    candidates: z.infer<typeof agentModelsOutputSchema>,
    userId: string,
  ): Promise<z.infer<typeof agentModelsOutputSchema>> {
    const verifiedModels: z.infer<typeof agentModelsOutputSchema> = [];

    for (let start = 0; start < candidates.length; start += MODEL_PROBE_CONCURRENCY) {
      const batch = candidates.slice(start, start + MODEL_PROBE_CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (model) => {
          try {
            await agentKey.provider.probeModel(agentKey.apiKey, model.id);
            return model;
          } catch (error) {
            this.logger.debug(
              `AI model probe rejected: provider=${agentKey.provider.name}, model=${model.id}, userId=${userId}, reason=${error instanceof Error ? error.message : 'unknown'}`,
            );
            return null;
          }
        }),
      );
      verifiedModels.push(...results.filter((model) => model !== null));
    }

    return verifiedModels;
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

  async chat(
    { text, apiKeyId, model }: z.infer<typeof agentChatInputSchema>,
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

    try {
      return await agentKey.provider.chat({
        apiKey: agentKey.apiKey,
        text,
        model,
      });
    } catch (error) {
      if (this.isModelUnavailableError(error)) {
        await this.refreshModels(agentKey, userId, model);
        throw new ORPCError('BAD_REQUEST', {
          message: 'This model is no longer available. Choose another model.',
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
}
