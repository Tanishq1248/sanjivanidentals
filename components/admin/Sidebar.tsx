"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Stethoscope,
  CalendarDays,
  Users,
  CreditCard,
  LogOut,
  TrendingUp,
  X,
  IndianRupee,
  Layers,
  Gift,
  Settings,
} from "lucide-react";
import { useAuth } from "../../lib/context/AuthContext";
import { getInvoices } from "../../lib/services/invoiceService";
import { queryKeys } from "../../lib/query/queryKeys";

export type SidebarPage =
  | "dashboard"
  | "calendar"
  | "patients"
  | "referrals"
  | "refer-earn"
  | "billing"
  | "expenses"
  | "pnl"
  | "settings"
  | string;

interface SidebarProps {
  currentPage: SidebarPage | string;
  onClose?: () => void;
}

export function Sidebar({ currentPage, onClose }: SidebarProps) {
  const { logout, user } = useAuth();

  /* Fetch invoices to show the pending billing badge directly */
  const { data: allInvoices = [] } = useQuery({
    queryKey: queryKeys.invoices.all,
    queryFn: getInvoices,
    staleTime: 2 * 60_000,
  });

  const pendingBillingCount = useMemo(
    () => allInvoices.filter((inv) => inv.paymentStatus === "Pending" || inv.paymentStatus === "Failed").length,
    [allInvoices]
  );

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      await logout();
    }
  };

  const dashboardItem = {
    href: "/admin",
    label: "Dashboard",
    icon: <Layers className="w-4 h-4 shrink-0" />,
    key: "dashboard",
  };

  const clinicalItems = [
    { href: "/admin/calendar", label: "Calendar", icon: <CalendarDays className="w-4 h-4 shrink-0" />, key: "calendar" },
    { href: "/admin/patients", label: "Patients", icon: <Users className="w-4 h-4 shrink-0" />, key: "patients" },
    { href: "/admin/finance/analytics", label: "Analytics", icon: <TrendingUp className="w-4 h-4 shrink-0" />, key: "analytics" },
  ];

  const financeItems = [
    {
      href: "/admin/billing",
      label: "Billing",
      icon: <CreditCard className="w-4 h-4 shrink-0" />,
      key: "billing",
      badge: pendingBillingCount > 0 ? (pendingBillingCount > 99 ? "99+" : String(pendingBillingCount)) : null,
    },
    { href: "/admin/finance/expenses", label: "Expenses", icon: <IndianRupee className="w-4 h-4 shrink-0" />, key: "expenses" },
  ];

  const adminItems = [
    { href: "/admin/settings", label: "Settings", icon: <Settings className="w-4 h-4 shrink-0" />, key: "settings" },
  ];

  return (
    <aside className="w-full h-full bg-white flex flex-col font-sans">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center gap-2" onClick={onClose}>
          <Stethoscope className="w-6 h-6 text-primary" />
          <div>
            <p className="font-bold text-base text-primary leading-tight">DentaPure</p>
            <p className="text-[10px] text-on-surface-variant font-medium leading-tight">Clinical Excellence</p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer flex items-center justify-center border-none bg-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-grow overflow-y-auto py-4 px-3 space-y-5" style={{ scrollbarWidth: "thin", scrollbarColor: "#bfc7d4 transparent" }}>
        {/* Top level Dashboard */}
        <div className="space-y-0.5">
          <Link
            href={dashboardItem.href}
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              currentPage === dashboardItem.key
                ? "bg-secondary-container text-primary shadow-sm"
                : "text-secondary hover:bg-surface-container-low hover:text-on-surface"
            }`}
          >
            {dashboardItem.icon}
            <span className="flex-1">{dashboardItem.label}</span>
          </Link>
        </div>

        {/* Clinical Workspace Section */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/50">
            Clinical Workspace
          </div>
          <div className="space-y-0.5">
            {clinicalItems.map(({ href, label, icon, key }) => {
              const isActive = currentPage === key;
              return (
                <Link
                  key={key}
                  href={href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-secondary-container text-primary shadow-sm"
                      : "text-secondary hover:bg-surface-container-low hover:text-on-surface"
                  }`}
                >
                  {icon}
                  <span className="flex-1">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Finance & Accounts Section */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/50">
            Finance & Accounts
          </div>
          <div className="space-y-0.5">
            {financeItems.map(({ href, label, icon, key, badge }) => {
              const isActive = currentPage === key;
              return (
                <Link
                  key={key}
                  href={href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-secondary-container text-primary shadow-sm"
                      : "text-secondary hover:bg-surface-container-low hover:text-on-surface"
                  }`}
                >
                  {icon}
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold leading-none flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Administration Section */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/50">
            Administration
          </div>
          <div className="space-y-0.5">
            {adminItems.map(({ href, label, icon, key }) => {
              const isActive = currentPage === key;
              return (
                <Link
                  key={key}
                  href={href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-secondary-container text-primary shadow-sm"
                      : "text-secondary hover:bg-surface-container-low hover:text-on-surface"
                  }`}
                >
                  {icon}
                  <span className="flex-1">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom CTA: Refer & Earn (Secondary Entry Point) */}
      <div className="px-3 py-2 shrink-0 border-t border-outline-variant/10">
        <Link
          href="/admin/refer-earn"
          onClick={onClose}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
            currentPage === "refer-earn" || currentPage === "referrals"
              ? "bg-amber-50 text-amber-900 border-amber-200/80 shadow-xs"
              : "bg-surface-container-lowest text-on-surface-variant/80 border-outline-variant/20 hover:bg-amber-50/60 hover:text-amber-900 hover:border-amber-200/60"
          }`}
        >
          <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="flex-1 truncate">Refer & Earn</span>
          <span className="px-1.5 py-0.5 rounded-full bg-amber-100/80 text-amber-800 text-[9px] font-bold">New</span>
        </Link>
      </div>

      {/* Footer Profile & Logout */}
      <div className="px-3 py-3 border-t border-outline-variant/20 bg-surface-container-lowest flex flex-col gap-1.5 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white font-extrabold text-[10px]">
            {user?.email?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-on-surface truncate">{user?.email || "Clinician"}</p>
            <p className="text-[9px] text-on-surface-variant/70 font-semibold uppercase">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 text-xs font-bold py-2 px-4 rounded-xl hover:bg-red-100 transition-all cursor-pointer flex items-center justify-center gap-2 border-none active:scale-[0.99]"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </aside>
  );
}

