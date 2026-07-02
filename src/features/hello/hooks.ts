import { useQuery } from "@tanstack/react-query";
import type { HelloStats } from "./types";
import { helloQueryKeys } from "./queryKeys";

// Replace this with a real API call using httpClient:
//
//   import { httpClient } from "../../api/httpClient";
//
//   async function fetchHelloStats(): Promise<HelloStats> {
//     return httpClient.post<HelloStats>(
//       "/orcaagents/db/workspace/doc/read",
//       { docId: "apps/hello/stats/current" }
//     );
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
