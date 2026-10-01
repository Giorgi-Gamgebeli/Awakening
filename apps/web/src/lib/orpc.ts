import { createORPCClient } from '@orpc/client';
import type { ContractRouterClient } from '@orpc/contract';
import { OpenAPILink } from '@orpc/openapi-client/fetch';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { apiKeysContract } from '@repo/zod';

const link = new OpenAPILink(apiKeysContract, {
  url: import.meta.env.VITE_SERVER_BASE_URL,
  fetch(request, init) {
    return fetch(request, { ...init, credentials: 'include' });
  },
});

const client = createORPCClient<
  ContractRouterClient<typeof apiKeysContract>
>(link);

export const orpc = createTanstackQueryUtils(client);
