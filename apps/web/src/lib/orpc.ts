// import { createORPCClient } from "@orpc/client";
// import type { ContractRouterClient } from "@orpc/contract";
// import { OpenAPILink } from "@orpc/openapi-client/fetch";
// import { authContract } from "@repo/zod";

// const link = new OpenAPILink(authContract, {
//   url: import.meta.env.VITE_SERVER_BASE_URL,
//   fetch(request, init) {
//     return fetch(request, { ...init, credentials: "include" });
//   },
// });

// export const orpc = createORPCClient<ContractRouterClient<typeof authContract>>(
//   link,
// );
