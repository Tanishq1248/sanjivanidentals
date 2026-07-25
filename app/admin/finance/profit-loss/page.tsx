"use client";

import React from "react";
import { AdminAuthGuard } from "../../../../components/auth/AdminAuthGuard";
import { AnalyticsPageContent } from "../analytics/page";

export default function Page() {
  return (
    <AdminAuthGuard>
      <AnalyticsPageContent />
    </AdminAuthGuard>
  );
}
