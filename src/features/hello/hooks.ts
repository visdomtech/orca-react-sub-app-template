import { useQuery } from "@tanstack/react-query";
import type { HelloStats } from "./types";
import { helloQueryKeys } from "./queryKeys";

// Replace this with a real API call using httpClient + secured():
//
//   import { httpClient } from "../../api/httpClient";
//   import { secured } from "../../api/secured";
//   import type { Response } from "../../api/types";
//
//   async function fetchHelloStats(): Promise<HelloStats> {
//     const response = await httpClient.get<Response<HelloStats>>(
//       secured("/hello/stats")
//     );
//     return response.data;
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
