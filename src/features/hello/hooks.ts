import { useQuery } from "@tanstack/react-query";
import type { HelloStats } from "./types";
import { helloQueryKeys } from "./queryKeys";

// Replace this with a real API call using httpClient + orcaagents():
//
//   import { httpClient } from "../../api/httpClient";
//   import { orcaagents } from "../../api/secured";
//
//   async function fetchHelloStats(): Promise<HelloStats> {
//     const res = await httpClient.post<HelloStats>(
//       orcaagents("/db/workspace/doc/read"),
//       { docId: "apps/hello/stats/current" }
//     );
//     return res;
//   }

function fetchHelloStats(): Promise<HelloStats> {
  return Promise.resolve({
    greeting: "Hello from Orca Sub-App!",
    loadedAt: new Date().toISOString(),
  });
}

export function useHelloStats() {
  return useQuery({
    queryKey: helloQueryKeys.stats(),
    queryFn: fetchHelloStats,
  });
}
