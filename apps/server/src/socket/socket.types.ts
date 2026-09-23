import type { Socket } from 'socket.io';

export type SocketUser = {
  id: string;
};

export type AuthenticatedSocket = Socket<any, any, any, { user: SocketUser }>;
