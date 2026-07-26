import { redirect } from "react-router";
import { useAuthStore } from "./store";

export async function authOnlyMiddleware(
  { request }: { request: Request },
  next: () => Promise<unknown>,
) {
  const { isAuthenticated } = useAuthStore.getState();

  if (!isAuthenticated) {
    const url = new URL(request.url);

    throw redirect(`/login?redirectTo=${url.pathname}`);
  }

  return next();
}

export async function authPagesMiddleware(
  _args: { request: Request },
  next: () => Promise<unknown>,
) {
  const { isAuthenticated } = useAuthStore.getState();

  if (isAuthenticated) throw redirect(`/home`);

  return next();
}
