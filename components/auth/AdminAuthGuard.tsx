                                                                                                                                                              "use client";

import React from "react";
import { useAuth } from "../../lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { Stethoscope } from "lucide-react";

/**
 * Wraps admin pages. Redirects to /admin/login if not authenticated.
 * Shows a loading spinner while auth state is resolving.
 */
export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace("/admin/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f5f8]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center animate-pulse">
            <Stethoscope className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-on-surface-variant font-medium">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
