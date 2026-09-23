import { Injectable } from '@nestjs/common';
import { db } from '@repo/db';

@Injectable()
export class SocketService {
  private readonly socketIdsByUserId = new Map<string, Set<string>>();

  registerSocket(userId: string, socketId: string) {
    const socketIds = this.socketIdsByUserId.get(userId) ?? new Set<string>();
    const firstConnection = socketIds.size === 0;

    socketIds.add(socketId);
    this.socketIdsByUserId.set(userId, socketIds);

    return { firstConnection };
  }

  unregisterSocket(userId: string, socketId: string) {
    const socketIds = this.socketIdsByUserId.get(userId);

    if (!socketIds) {
      return { lastConnection: false };
    }

    socketIds.delete(socketId);

    if (socketIds.size > 0) {
      return { lastConnection: false };
    }

    this.socketIdsByUserId.delete(userId);
    return { lastConnection: true };
  }

  async getInitialRooms(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        groupChats: { select: { id: true } },
        friends: { select: { id: true } },
        friendOf: { select: { id: true, status: true } },
      },
    });

    if (!user) {
      throw new Error('Socket user no longer exists');
    }

    const sentFriendIds = new Set(user.friends.map((friend) => friend.id));

    const mutualFriends = user.friendOf.filter((friend) =>
      sentFriendIds.has(friend.id),
    );

    return {
      groupRoomNames: user.groupChats.map((group) => `group:${group.id}`),
      presenceRoomNames: mutualFriends.map((friend) => `presence:${friend.id}`),
      presenceSnapshot: mutualFriends,
    };
  }
}
