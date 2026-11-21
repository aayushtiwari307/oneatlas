"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { CompareSelectionProvider } from "@/features/compare/compare-selection-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  // One QueryClient per browser app instance; never share cached user data on the server.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CompareSelectionProvider>{children}</CompareSelectionProvider>
    </QueryClientProvider>
  );
}
