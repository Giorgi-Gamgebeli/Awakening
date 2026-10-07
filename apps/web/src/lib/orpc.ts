import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { appContract } from "@repo/zod";
import { env } from "../env";

const link = new OpenAPILink(appContract, {
  url: env.VITE_SERVER_BASE_URL,
  fetch(request, init) {
    return fetch(request, { ...init, credentials: "include" });
  },
});

const client = createORPCClient<ContractRouterClient<typeof appContract>>(link);

export const orpc = createTanstackQueryUtils(client);
