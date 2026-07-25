import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@repo/server/trpc/router";

export const queryClient = new QueryClient();

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_SERVER_BASE_URL}/trpc`,
    }),
  ],
});

export const trpc: ReturnType<typeof createTRPCOptionsProxy<AppRouter>> =
  createTRPCOptionsProxy<AppRouter>({
    client: trpcClient,
    queryClient,
  });
