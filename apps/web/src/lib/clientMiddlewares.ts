import { redirect } from "react-router";
import Session from "supertokens-auth-react/recipe/session";

export async function authOnlyMiddleware(
  { request }: { request: Request },
  next: () => Promise<unknown>,
) {
  if (!(await Session.doesSessionExist())) {
    const url = new URL(request.url);

    throw redirect(`/login?redirectTo=${url.pathname}`);
  }

  return next();
}

export async function authPagesMiddleware(
  _args: { request: Request },
  next: () => Promise<unknown>,
) {
  if (await Session.doesSessionExist()) throw redirect(`/home`);

  return next();
}
