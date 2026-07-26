"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AdminAuthGuard } from "../../../components/auth/AdminAuthGuard";

function PrescriptionsRedirector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get("id");
    const patientId = searchParams.get("patientId");

    if (id) {
      router.replace(`/prescriptions/${id}`);
    } else if (patientId) {
      router.replace(`/admin/patients/${patientId}?tab=encounters`);
    } else {
      router.replace("/admin/patients");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f2f5f8]">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}

export default function PrescriptionsIndexPage() {
  return (
    <AdminAuthGuard>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[#f2f5f8]">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        }
      >
        <PrescriptionsRedirector />
      </Suspense>
    </AdminAuthGuard>
  );
}
