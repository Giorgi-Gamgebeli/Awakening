import { Injectable } from '@nestjs/common';
import { ORPCError } from '@orpc/server';
import { db } from '@repo/db';
import {
  ApiKeysPatchInputSchema,
  ApiKeysCreateInputSchema,
  ApiKeysDeleteSchema,
  z,
} from '@repo/zod';
import { CryptoService } from '../crypto/crypto.service';

@Injectable()
export class ApiKeysService {
  constructor(private readonly cryptoService: CryptoService) {}

  async create(
    { key, provider, purpose }: z.infer<typeof ApiKeysCreateInputSchema>,
    userId: string,
  ) {
    const encryptedKey = this.cryptoService.encrypt(key);

    const apiKey = await db.userApiKeys.create({
      data: {
        key: encryptedKey,
        provider,
        purpose,
        userId,
      },
      select: {
        id: true,
        provider: true,
        purpose: true,
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
        purpose: true,
      },
    });
  }

  async patch(
    { purpose, provider, id }: z.infer<typeof ApiKeysPatchInputSchema>,
    userId: string,
  ) {
    const [updatedKey] = await db.userApiKeys.updateManyAndReturn({
      where: {
        id,
        userId,
      },
      data: {
        purpose,
        provider,
      },
      select: {
        id: true,
        provider: true,
        purpose: true,
      },
    });

    if (!updatedKey) {
      throw new ORPCError('NOT_FOUND', {
        message: 'API key not found.',
      });
    }

    return updatedKey;
  }

  async delete(
    { id }: z.infer<typeof ApiKeysDeleteSchema>,
    userId: string,
  ) {
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
