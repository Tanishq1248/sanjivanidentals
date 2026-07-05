"use client";

import React, { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "../lib/context/AuthContext";
import { makeQueryClient } from "../lib/query/queryClient";

export function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures we create one client per component lifecycle on the
  // browser (never recreated on re-render), while makeQueryClient() is called
  // fresh on every server render.
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      {/* Devtools panel — tree-shaken out of production builds automatically */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
