import React from "react";

export function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-1">
      {/* Header skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm space-y-3">
        <div className="w-36 h-4 bg-slate-200 rounded-full" />
        <div className="w-64 h-6 bg-slate-200 rounded-lg" />
        <div className="w-96 h-4 bg-slate-100 rounded-lg" />
      </div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-44 bg-white rounded-2xl border border-outline-variant/20 p-5 space-y-4">
          <div className="w-10 h-10 bg-slate-200 rounded-xl" />
          <div className="w-40 h-5 bg-slate-200 rounded" />
          <div className="w-full h-3 bg-slate-100 rounded" />
          <div className="w-3/4 h-3 bg-slate-100 rounded" />
        </div>
        <div className="h-44 bg-white rounded-2xl border border-outline-variant/20 p-5 space-y-4">
          <div className="w-10 h-10 bg-slate-200 rounded-xl" />
          <div className="w-40 h-5 bg-slate-200 rounded" />
          <div className="w-full h-3 bg-slate-100 rounded" />
          <div className="w-3/4 h-3 bg-slate-100 rounded" />
        </div>
      </div>

      {/* Table / Form skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="w-48 h-5 bg-slate-200 rounded" />
          <div className="w-24 h-8 bg-slate-200 rounded-xl" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-50">
              <div className="w-9 h-9 bg-slate-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="w-36 h-4 bg-slate-200 rounded" />
                <div className="w-24 h-3 bg-slate-100 rounded" />
              </div>
              <div className="w-20 h-6 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
