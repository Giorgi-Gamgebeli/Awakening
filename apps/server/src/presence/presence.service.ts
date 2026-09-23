import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class PresenceService {
  emitStatusUpdate(
    server: Server,
    userId: string,
    status: 'ONLINE' | 'OFFLINE',
  ) {
    const payload = { userId, status };

    server.to(`presence:${userId}`).emit('user:status', payload);
  }
}
