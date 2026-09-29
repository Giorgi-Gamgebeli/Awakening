import { Injectable } from '@nestjs/common';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { db } from '@repo/db';
import { CreateApiKeySchema, z } from '@repo/zod';

@Injectable()
export class ApiKeysService {
  async create(body: z.infer<typeof CreateApiKeySchema>) {
    try {
      const result = CreateApiKeySchema.safeParse(body);
      if (!result.success) throw new Error('Server type validation failed!');
      const { key, provider, userId } = result.data;

      const encryptedKey = key;

      await db.userApiKeys.create({
        data: {
          key: encryptedKey,
          provider,
          userId,
        },
      });

      return 'This action adds a new apiKey';
    } catch (error) {}
  }

  findOne(id: number) {
    return `This action returns a #${id} apiKey`;
  }

  update(id: number, updateApiKeyDto: UpdateApiKeyDto) {
    return `This action updates a #${id} apiKey`;
  }

  remove(id: number) {
    return `This action removes a #${id} apiKey`;
  }
}
