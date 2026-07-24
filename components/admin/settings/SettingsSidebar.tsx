"use client";

import React from "react";
import { SETTINGS_NAV_ITEMS, SettingsNavItem } from "./settingsNavConfig";
import { ChevronRight, Settings } from "lucide-react";

interface SettingsSidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
}

export function SettingsSidebar({ activeTab, onSelectTab }: SettingsSidebarProps) {
  // Group items by category for visual organization
  const categories = Array.from(new Set(SETTINGS_NAV_ITEMS.map((item) => item.category)));

  return (
    <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-4 flex flex-col gap-4 font-sans">
      {/* Header */}
      <div className="px-2 py-1 flex items-center justify-between border-b border-outline-variant/15 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-base text-on-surface leading-tight">Settings</h2>
            <p className="text-[11px] text-on-surface-variant font-medium">Clinic & Admin Options</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="space-y-4">
        {categories.map((category) => {
          const items = SETTINGS_NAV_ITEMS.filter((item) => item.category === category);
          return (
            <div key={category} className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant/50">
                {category}
              </p>
              <div className="space-y-0.5">
                {items.map((item: SettingsNavItem) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border-none text-left group ${
                        isActive
                          ? "bg-primary text-white shadow-sm font-bold"
                          : "text-secondary hover:bg-surface-container-low hover:text-primary"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                            isActive ? "text-white" : "text-primary/70 group-hover:text-primary"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                          isActive ? "text-white translate-x-0.5" : "text-on-surface-variant/30 group-hover:text-primary group-hover:translate-x-0.5"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
