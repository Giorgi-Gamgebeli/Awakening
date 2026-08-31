import { redirect } from "react-router";
import { authClient } from "./authClient";

export async function authOnlyMiddleware(
  { request }: { request: Request },
  next: () => Promise<unknown>,
) {
  const { data: session } = await authClient.getSession();

  if (!session) {
    const url = new URL(request.url);

    throw redirect(`/login?redirectTo=${url.pathname}`);
  }

  // await new Promise((res, rej) => setTimeout(res, 1000));

  return next();
}

export async function authPagesMiddleware(
  _args: { request: Request },
  next: () => Promise<unknown>,
) {
  const { data: session } = await authClient.getSession();

  if (session) throw redirect(`/home`);

  // await new Promise((res, rej) => setTimeout(res, 1000));

  return next();
}
