"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Settings as SettingsIcon, Menu } from "lucide-react";
import { AdminAuthGuard } from "../../../components/auth/AdminAuthGuard";
import { useAuth } from "../../../lib/context/AuthContext";
import { useSidebarStore } from "../../../lib/store/useSidebarStore";
import { Sidebar } from "../../../components/admin/Sidebar";
import { SettingsSidebar } from "../../../components/admin/settings/SettingsSidebar";
import { SettingsSkeleton } from "../../../components/admin/settings/SettingsSkeleton";

// ── Lazy Load Settings Subsections with Code Splitting ──
const ClinicInfoSection = dynamic(
  () => import("../../../components/admin/settings/sections/ClinicInfoSection"),
  { loading: () => <SettingsSkeleton /> }
);

const TeamManagementSection = dynamic(
  () => import("../../../components/admin/settings/sections/TeamManagementSection"),
  { loading: () => <SettingsSkeleton /> }
);

const ClinicResourcesSection = dynamic(
  () => import("../../../components/admin/settings/sections/ClinicResourcesSection"),
  { loading: () => <SettingsSkeleton /> }
);

const AppointmentSettingsSection = dynamic(
  () => import("../../../components/admin/settings/sections/AppointmentSettingsSection"),
  { loading: () => <SettingsSkeleton /> }
);

const BillingSettingsSection = dynamic(
  () => import("../../../components/admin/settings/sections/BillingSettingsSection"),
  { loading: () => <SettingsSkeleton /> }
);

const PrescriptionSettingsSection = dynamic(
  () => import("../../../components/admin/settings/sections/PrescriptionSettingsSection"),
  { loading: () => <SettingsSkeleton /> }
);

const NotificationSettingsSection = dynamic(
  () => import("../../../components/admin/settings/sections/NotificationSettingsSection"),
  { loading: () => <SettingsSkeleton /> }
);

const SecuritySettingsSection = dynamic(
  () => import("../../../components/admin/settings/sections/SecuritySettingsSection"),
  { loading: () => <SettingsSkeleton /> }
);

const BackupSettingsSection = dynamic(
  () => import("../../../components/admin/settings/sections/BackupSettingsSection"),
  { loading: () => <SettingsSkeleton /> }
);

const MessageTemplatesSection = dynamic(
  () => import("../../../components/admin/settings/sections/MessageTemplatesSection"),
  { loading: () => <SettingsSkeleton /> }
);

// Map section IDs to lazy loaded components
const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  "clinic-info": ClinicInfoSection,
  team: TeamManagementSection,
  "clinic-resources": ClinicResourcesSection,
  appointments: AppointmentSettingsSection,
  "message-templates": MessageTemplatesSection,
  billing: BillingSettingsSection,
  prescription: PrescriptionSettingsSection,
  notifications: NotificationSettingsSection,
  security: SecuritySettingsSection,
  backup: BackupSettingsSection,
};

function SettingsModuleContent() {
  const { user } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read tab parameter from URL, default to "team"
  const tabFromUrl = searchParams.get("tab") || "team";
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);

  // Sync state if URL searchParams change
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (currentTab && SECTION_COMPONENTS[currentTab]) {
      setActiveTab(currentTab);
    }
  }, [searchParams]);

  // Tab selection handler with URL state preservation
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.replace(`/admin/settings?${params.toString()}`, { scroll: false });
  };

  // Determine active component
  const ActiveComponent = useMemo(() => {
    return SECTION_COMPONENTS[activeTab] || TeamManagementSection;
  }, [activeTab]);

  return (
    <div className="min-h-screen flex bg-[#f2f5f8] font-sans">
      {/* Mobile main navigation sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Desktop Main Sidebar */}
      <div className="hidden md:flex shrink-0 sticky top-0 h-screen shadow-2xs z-30">
        <Sidebar currentPage="settings" />
      </div>

      {/* Mobile Main Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[220px] shadow-level-2 transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar currentPage="settings" onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="bg-white border-b border-outline-variant/20 px-4 md:px-6 py-4 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-surface-variant text-primary shrink-0 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-primary font-sans leading-tight">Settings & Administration</h1>
              <p className="text-xs text-on-surface-variant hidden sm:block">
                Clinic configuration, team permissions, preferences, and backups
              </p>
            </div>
          </div>
          <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-secondary-container shrink-0 bg-primary flex items-center justify-center ml-auto">
            <span className="text-white font-bold text-sm">{user?.email?.[0]?.toUpperCase() || "A"}</span>
          </div>
        </header>

        {/* Content Body: Two-Column Layout */}
        <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Column: Vertical Settings Navigation Card */}
            <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24">
              <SettingsSidebar activeTab={activeTab} onSelectTab={handleTabChange} />
            </aside>

            {/* Right Column: Selected Settings Content */}
            <div className="flex-1 min-w-0 w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <Suspense fallback={<SettingsSkeleton />}>
                    <ActiveComponent />
                  </Suspense>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AdminAuthGuard>
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsModuleContent />
      </Suspense>
    </AdminAuthGuard>
  );
}
