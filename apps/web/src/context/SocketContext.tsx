import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { io, type Socket } from "socket.io-client";
import { authClient } from "../lib/authClient";

export type UserStatus = "ONLINE" | "OFFLINE" | "IDLE" | "DO_NOT_DISTURB";

type PresenceUpdate = {
  userId: string;
  status: UserStatus;
};

type ServerToClientEvents = {
  "presence:snapshot": (payload: { statuses: PresenceUpdate[] }) => void;
  "user:status": (payload: PresenceUpdate) => void;
};

type ClientToServerEvents = Record<string, never>;

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type SocketContextValue = {
  socket: AppSocket | null;
  isConnected: boolean;
  presenceByUserId: Readonly<Record<string, UserStatus>>;
};

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: Readonly<PropsWithChildren>) {
  const { data: session } = authClient.useSession();
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [presenceByUserId, setPresenceByUserId] = useState<
    Record<string, UserStatus>
  >({});

  useEffect(() => {
    if (!session?.user.id) return;

    const nextSocket: AppSocket = io(import.meta.env.VITE_SERVER_BASE_URL, {
      autoConnect: false,
      withCredentials: true,
    });

    nextSocket.on("connect", () => {
      setIsConnected(true);
    });

    nextSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    nextSocket.on("presence:snapshot", ({ statuses }) => {
      const nextPresence: Record<string, UserStatus> = {};

      for (const { userId, status } of statuses) {
        nextPresence[userId] = status;
      }

      setPresenceByUserId(nextPresence);
    });

    nextSocket.on("user:status", ({ userId, status }) => {
      setPresenceByUserId((currentPresence) => ({
        ...currentPresence,
        [userId]: status,
      }));
    });

    setSocket(nextSocket);
    nextSocket.connect();

    return () => {
      nextSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setPresenceByUserId({});
    };
  }, [session?.user.id]);

  const value = useMemo(
    () => ({ socket, isConnected, presenceByUserId }),
    [isConnected, presenceByUserId, socket],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used inside SocketProvider");
  }

  return context;
}
