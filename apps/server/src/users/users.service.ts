import { Injectable } from '@nestjs/common';
import { db } from '@repo/db';

@Injectable()
export class UsersService {
  async updateStatus({
    userId,
    status,
  }: {
    userId: string;
    status: 'ONLINE' | 'OFFLINE';
  }): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: { status },
    });
  }
}
