import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { fromNodeHeaders } from 'better-auth/node';
import { Server } from 'socket.io';
import { auth } from '../auth/auth';
import { env } from '../env';
import { PresenceService } from '../presence/presence.service';
import { UsersService } from '../users/users.service';
import { SocketService } from './socket.service';
import { AuthenticatedSocket } from './socket.types';

@WebSocketGateway({
  cors: {
    origin: env.VITE_WEB_BASE_URL,
    credentials: true,
  },
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(SocketGateway.name);

  @WebSocketServer()
  declare server: Server;

  constructor(
    private readonly socketService: SocketService,
    private readonly presenceService: PresenceService,
    private readonly usersService: UsersService,
  ) {}

  afterInit(server: Server) {
    server.use(async (client, next) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(client.handshake.headers),
        });

        if (!session) {
          return next(new Error('Unauthorized'));
        }

        client.data.user = {
          id: session.user.id,
        };

        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    });
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const userId = client.data.user.id;

      await client.join(`user:${userId}`);
      await client.join(`presence:${userId}`);

      const { groupRoomNames, presenceRoomNames, presenceSnapshot } =
        await this.socketService.getInitialRooms(userId);

      client.emit('presence:snapshot', {
        statuses: presenceSnapshot,
      });

      await client.join(groupRoomNames);
      await client.join(presenceRoomNames);

      const { firstConnection } = this.socketService.registerSocket(
        userId,
        client.id,
      );

      if (!firstConnection) return;

      await this.usersService.updateStatus({
        userId,
        status: 'ONLINE',
      });

      this.presenceService.emitStatusUpdate(this.server, userId, 'ONLINE');
    } catch (error) {
      this.logger.error(error, 'Socket connection failed');
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    try {
      const userId = client.data.user.id;
      if (!userId) return;

      const { lastConnection } = this.socketService.unregisterSocket(
        userId,
        client.id,
      );

      if (!lastConnection) return;

      await this.usersService.updateStatus({
        userId,
        status: 'OFFLINE',
      });

      this.presenceService.emitStatusUpdate(this.server, userId, 'OFFLINE');
    } catch (error) {
      this.logger.error(error, 'Socket disconnect cleanup failed');
    }
  }
}
