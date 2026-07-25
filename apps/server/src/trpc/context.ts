import { AuthService } from "../auth/auth.service";

export function createContext(authService: AuthService) {
  return { authService };
}

export type Context = ReturnType<typeof createContext>;
