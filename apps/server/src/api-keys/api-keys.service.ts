import { Injectable } from '@nestjs/common';
import { ORPCError } from '@orpc/server';
import { db, Prisma } from '@repo/db';
import {
  ApiKeysPatchInputSchema,
  ApiKeysPatchOutputSchema,
  ApiKeysCreateInputSchema,
  ApiKeysDeleteSchema,
  z,
} from '@repo/zod';
import { CryptoService } from '../crypto/crypto.service';

@Injectable()
export class ApiKeysService {
  constructor(private readonly cryptoService: CryptoService) {}

  async create(
    { key, provider, label }: z.infer<typeof ApiKeysCreateInputSchema>,
    userId: string,
  ) {
    const encryptedKey = this.cryptoService.encrypt(key);

    // The first key becomes active so the AI has a default.
    const hasActiveKey = await db.userApiKeys.findFirst({
      where: { userId, isActive: true },
      select: { id: true },
    });

    const apiKey = await db.userApiKeys.create({
      data: {
        key: encryptedKey,
        provider,
        label,
        userId,
        isActive: !hasActiveKey,
      },
      select: {
        id: true,
        provider: true,
        label: true,
        selectedModel: true,
        isActive: true,
      },
    });

    return {
      ...apiKey,
    };
  }

  async findMany(userId: string) {
    return await db.userApiKeys.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        provider: true,
        label: true,
        selectedModel: true,
        isActive: true,
      },
    });
  }

  async patch(
    {
      provider,
      label,
      selectedModel,
      isActive,
      id,
    }: z.infer<typeof ApiKeysPatchInputSchema>,
    userId: string,
  ): Promise<z.infer<typeof ApiKeysPatchOutputSchema>> {
    const existing = await db.userApiKeys.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      throw new ORPCError('NOT_FOUND', {
        message: 'API key not found.',
      });
    }

    const updatedKey = await db.$transaction(async (tx) => {
      if (isActive) {
        // Only one key can be active for a user at a time.
        await tx.userApiKeys.updateMany({
          where: {
            userId,
            isActive: true,
            id: { not: id },
          },
          data: { isActive: false },
        });
      }

      return await tx.userApiKeys.update({
        where: { id },
        data: {
          provider,
          label,
          isActive,
          availableModels: provider === undefined ? undefined : Prisma.DbNull,
          modelsUpdatedAt: provider === undefined ? undefined : null,
          // A new provider invalidates the previously picked model.
          selectedModel: provider === undefined ? selectedModel : null,
        },
        select: {
          id: true,
          provider: true,
          label: true,
          selectedModel: true,
          isActive: true,
        },
      });
    });

    return updatedKey;
  }

  async delete({ id }: z.infer<typeof ApiKeysDeleteSchema>, userId: string) {
    const result = await db.userApiKeys.deleteMany({
      where: {
        id,
        userId,
      },
    });

    if (result.count === 0) {
      throw new ORPCError('NOT_FOUND', {
        message: 'API key not found.',
      });
    }

    return { id };
  }
}
