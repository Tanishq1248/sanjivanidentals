"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Stethoscope,
  LayoutDashboard,
  Calendar,
  Users,
  FlaskConical,
  Package,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Gift,
  X,
} from "lucide-react";
import { useAuth } from "../../lib/context/AuthContext";
import { getInvoices } from "../../lib/services/invoiceService";
import { getAppointments } from "../../lib/services/appointmentService";
import { queryKeys } from "../../lib/query/queryKeys";
import { useSidebarStore } from "../../lib/store/useSidebarStore";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  key: string;
  badge?: "todayCount" | "unpaidCount" | string | number;
  badgeColor?: string;
  featureFlag?: string;
}

export interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

export const SIDEBAR_NAVIGATION: NavGroup[] = [
  {
    groupLabel: "DAILY OPERATIONS",
    items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, key: "dashboard" },
      { name: "Calendar", href: "/admin/calendar", icon: Calendar, key: "calendar", badge: "todayCount" },
      { name: "Patients", href: "/admin/patients", icon: Users, key: "patients" },
    ],
  },
  {
    groupLabel: "CLINICAL & LAB",
    items: [
      { name: "Lab Orders", href: "/admin/labs", icon: FlaskConical, key: "labs" },
      { name: "Inventory", href: "/admin/inventory", icon: Package, key: "inventory" },
    ],
  },
  {
    groupLabel: "PRACTICE & FINANCE",
    items: [
      {
        name: "Billing & Invoices",
        href: "/admin/billing",
        icon: Receipt,
        key: "billing",
        badge: "unpaidCount",
        badgeColor: "bg-amber-500",
      },
      { name: "Expenses", href: "/admin/expenses", icon: CreditCard, key: "expenses" },
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3, key: "analytics" },
    ],
  },
  {
    groupLabel: "ADMINISTRATION",
    items: [
      { name: "Settings", href: "/admin/settings", icon: Settings, key: "settings" },
    ],
  },
];

export type SidebarPage =
  | "dashboard"
  | "calendar"
  | "patients"
  | "labs"
  | "inventory"
  | "billing"
  | "expenses"
  | "analytics"
  | "settings"
  | "referrals"
  | "refer-earn"
  | string;

interface SidebarProps {
  currentPage?: SidebarPage | string;
  onClose?: () => void;
}

export function Sidebar({ currentPage, onClose }: SidebarProps) {
  const { logout, user } = useAuth();
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse } = useSidebarStore();

  // Dynamic Query: Unpaid Invoices count
  const { data: allInvoices = [] } = useQuery({
    queryKey: queryKeys.invoices.all,
    queryFn: getInvoices,
    staleTime: 60 * 1000,
  });

  // Dynamic Query: Today's Appointments count
  const { data: todayAppointments = [] } = useQuery({
    queryKey: ["appointments", "today"],
    queryFn: () => getAppointments("today"),
    staleTime: 60 * 1000,
  });

  const unpaidInvoicesCount = useMemo(() => {
    return allInvoices.filter((inv) => {
      const total = inv.total ?? inv.netAmount ?? inv.amount ?? 0;
      const paid = inv.paidAmount || 0;
      return (total - paid) > 0 && inv.paymentStatus !== "Paid";
    }).length;
  }, [allInvoices]);

  const todayAppointmentsCount = useMemo(() => {
    return todayAppointments.length;
  }, [todayAppointments]);

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      await logout();
    }
  };

  const isItemActive = (item: NavItem) => {
    if (currentPage) {
      if (currentPage === item.key) return true;
      if (item.key === "dashboard" && (currentPage === "dashboard" || currentPage === "admin")) return true;
      if (item.key === "analytics" && (currentPage === "analytics" || currentPage === "messaging-analytics")) return true;
    }
    if (pathname) {
      if (item.href === "/admin/dashboard" && (pathname === "/admin" || pathname === "/admin/dashboard")) return true;
      if (pathname.startsWith(item.href)) return true;
    }
    return false;
  };

  const resolveBadge = (badgeType?: string | number) => {
    if (!badgeType) return null;
    if (badgeType === "todayCount") {
      return todayAppointmentsCount > 0 ? todayAppointmentsCount : null;
    }
    if (badgeType === "unpaidCount") {
      return unpaidInvoicesCount > 0 ? (unpaidInvoicesCount > 99 ? "99+" : unpaidInvoicesCount) : null;
    }
    return badgeType;
  };

  return (
    <aside
      className={`h-full bg-white flex flex-col font-sans transition-all duration-200 border-r border-slate-200 select-none ${
        isCollapsed ? "w-[68px]" : "w-[220px]"
      }`}
    >
      {/* ── Brand Header ── */}
      <div
        className={`py-3.5 border-b border-slate-100 flex items-center shrink-0 ${
          isCollapsed ? "px-2 justify-center" : "px-4 justify-between"
        }`}
      >
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2.5 overflow-hidden group"
          onClick={onClose}
          title="DentaPure Clinical Operations"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-2xs group-hover:bg-indigo-700 transition-colors">
            <Stethoscope className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="font-extrabold text-sm text-slate-900 leading-tight tracking-tight">
                DentaPure
              </p>
              <p className="text-[10px] text-slate-400 font-semibold leading-tight">
                Clinical Excellence
              </p>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        {onClose ? (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          /* Desktop collapse toggle */
          !isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="hidden md:flex p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )
        )}
      </div>

      {/* Desktop Expand Button when collapsed */}
      {isCollapsed && (
        <div className="hidden md:flex justify-center py-1.5 border-b border-slate-100 bg-slate-50">
          <button
            onClick={toggleCollapse}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Navigation Groups ── */}
      <div
        className="flex-1 overflow-y-auto py-3 px-2 space-y-4"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}
      >
        {SIDEBAR_NAVIGATION.map((group) => (
          <div key={group.groupLabel} className="space-y-1">
            {/* Group Label */}
            {!isCollapsed ? (
              <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {group.groupLabel}
              </div>
            ) : (
              <div className="h-px bg-slate-100 my-2 mx-1" />
            )}

            {/* Nav Items */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isItemActive(item);
                const badgeValue = resolveBadge(item.badge);
                const IconComponent = item.icon;

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={onClose}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center gap-2.5 rounded-xl text-xs font-bold transition-all group relative ${
                      isCollapsed
                        ? "p-2.5 justify-center"
                        : "px-3 py-2"
                    } ${
                      active
                        ? "bg-indigo-600 text-white shadow-2xs shadow-indigo-600/20"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <IconComponent
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        active ? "text-white" : "text-slate-500 group-hover:text-slate-900 group-hover:scale-105"
                      }`}
                    />

                    {!isCollapsed ? (
                      <>
                        <span className="flex-1 truncate">{item.name}</span>
                        {badgeValue !== null && (
                          <span
                            className={`min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-extrabold leading-none flex items-center justify-center shrink-0 shadow-2xs ${
                              item.badgeColor
                                ? `${item.badgeColor} text-white`
                                : active
                                ? "bg-white text-indigo-700 font-black"
                                : "bg-indigo-100 text-indigo-700"
                            }`}
                          >
                            {badgeValue}
                          </span>
                        )}
                      </>
                    ) : (
                      /* Collapsed dot badge */
                      badgeValue !== null && (
                        <span
                          className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white ${
                            item.badgeColor || "bg-indigo-500"
                          }`}
                        />
                      )
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Secondary CTA: Refer & Earn ── */}
      <div className={`py-2 border-t border-slate-100 ${isCollapsed ? "px-2" : "px-3"}`}>
        <Link
          href="/admin/refer-earn"
          onClick={onClose}
          title={isCollapsed ? "Refer & Earn" : undefined}
          className={`flex items-center gap-2 rounded-xl text-xs font-bold border transition-all ${
            isCollapsed ? "p-2 justify-center" : "px-2.5 py-1.5"
          } ${
            currentPage === "refer-earn" || currentPage === "referrals"
              ? "bg-amber-50 text-amber-900 border-amber-200 shadow-2xs"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-200"
          }`}
        >
          <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 truncate text-[11px]">Refer & Earn</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-200/60 text-amber-800 text-[9px] font-extrabold">
                New
              </span>
            </>
          )}
        </Link>
      </div>

      {/* ── Footer Profile & Logout ── */}
      <div
        className={`py-2.5 border-t border-slate-200 bg-slate-50 flex flex-col gap-1.5 shrink-0 ${
          isCollapsed ? "px-2" : "px-3"
        }`}
      >
        <div className={`flex items-center gap-2 ${isCollapsed ? "justify-center" : "px-1"}`}>
          <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-[10px] shrink-0 shadow-2xs">
            {user?.email?.[0]?.toUpperCase() || "A"}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                {user?.email?.split("@")[0] || "Clinician"}
              </p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                Administrator
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={`bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-rose-200/60 active:scale-[0.98] ${
            isCollapsed ? "p-2" : "py-1.5 px-3"
          }`}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
