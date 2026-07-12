"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  Calendar, 
  Percent, 
  HelpCircle,
  Menu,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import { AdminAuthGuard } from "../../../../components/auth/AdminAuthGuard";
import { useSidebarStore } from "../../../../lib/store/useSidebarStore";
import { Sidebar } from "../../../../components/admin/Sidebar";
import { queryKeys } from "../../../../lib/query/queryKeys";
import { getFinancialSummary } from "../../../../lib/services/expenseService";

// Helper to format currency
function formatINR(val: number) {
  if (isNaN(val)) return "0";
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0, // Round off for higher-level reporting
  });
}

function formatMonthName(yyyyMM: string) {
  if (!yyyyMM || yyyyMM.length < 7) return yyyyMM;
  const [year, month] = yyyyMM.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function ProfitLossPage() {
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();
  const [showAccountingHelp, setShowAccountingHelp] = useState(false);

  // Queries
  const { data: plData, isLoading, error } = useQuery({
    queryKey: queryKeys.finance.stats,
    queryFn: getFinancialSummary,
    staleTime: 30_000,
  });

  // Calculate maximum value for the chart scale
  const chartScaleMax = useMemo(() => {
    if (!plData || plData.monthlyBreakdown.length === 0) return 100000;
    const maxVal = Math.max(
      ...plData.monthlyBreakdown.map((r) => Math.max(r.revenuePaid, r.expenses, Math.abs(r.netProfit)))
    );
    return maxVal > 0 ? maxVal * 1.15 : 100000; // adding 15% padding
  }, [plData]);

  return (
    <div className="min-h-screen flex bg-[#f2f5f8] font-sans">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[200px] shrink-0 border-r border-outline-variant/20 sticky top-0 h-screen shadow-sm flex-col">
        <Sidebar currentPage="pnl" />
      </aside>

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[220px] shadow-level-2 transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          currentPage="pnl"
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-outline-variant/20 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-surface-variant text-primary shrink-0 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-teal-600" />
              <h1 className="text-lg font-bold text-primary font-sans leading-tight">Profit &amp; Loss Statement</h1>
            </div>
          </div>
          
          <button
            onClick={() => setShowAccountingHelp(!showAccountingHelp)}
            className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary border border-outline-variant/30 rounded-lg px-3 py-1.5 bg-white cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Accounting Methods</span>
          </button>
        </header>

        {/* Content Body */}
        <main className="flex-grow p-4 md:p-8 space-y-6">
          {/* Accounting Method Help Box */}
          {showAccountingHelp && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-xl p-5 space-y-3 shadow-sm transition-all">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-primary" />
                <span>Understanding Cash vs. Accrual Revenue</span>
              </div>
              <p className="text-xs leading-relaxed">
                <strong>Cash Basis (Cash Collected):</strong> Revenue is recognized only when the payment is actually received. This is the primary figure used to calculate the <strong>Net Profit</strong> and <strong>Profit Margin</strong>, reflecting real money in the bank.
              </p>
              <p className="text-xs leading-relaxed">
                <strong>Accrual Basis (Total Billed):</strong> Revenue is recognized when invoices are generated, regardless of whether they have been paid. This shows the total volume of business billed to patients.
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="p-8 text-center text-on-surface-variant">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm font-semibold">Generating Profit &amp; Loss Statement...</p>
            </div>
          ) : error || !plData ? (
            <div className="py-16 text-center text-on-surface-variant">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
              <p className="text-sm font-semibold">Error loading financial data</p>
              <p className="text-xs mt-1 text-on-surface-variant/75">
                Could not fetch transactions from the database. Please try again.
              </p>
            </div>
          ) : (
            <>
              {/* Financial KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* KPI 1: Cash Revenue */}
                <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] text-on-surface-variant/75 font-semibold uppercase tracking-wider block">Cash Revenue</span>
                    <span className="text-xl md:text-2xl font-extrabold text-teal-600 tracking-tight block">
                      ₹{formatINR(plData.revenuePaid)}
                    </span>
                    <span className="text-[10px] font-semibold text-on-surface-variant/50 block">Cash collected in-hand</span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5 text-teal-600" />
                  </div>
                </div>

                {/* KPI 2: Accrual Revenue */}
                <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] text-on-surface-variant/75 font-semibold uppercase tracking-wider block">Billed Revenue</span>
                    <span className="text-xl md:text-2xl font-extrabold text-blue-600 tracking-tight block">
                      ₹{formatINR(plData.revenueBilled)}
                    </span>
                    <span className="text-[10px] font-semibold text-on-surface-variant/50 block">Accrual billing volume</span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <IndianRupee className="w-5 h-5 text-blue-600" />
                  </div>
                </div>

                {/* KPI 3: Total Expenses */}
                <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] text-on-surface-variant/75 font-semibold uppercase tracking-wider block">Total Expenses</span>
                    <span className="text-xl md:text-2xl font-extrabold text-red-600 tracking-tight block">
                      ₹{formatINR(plData.expenses)}
                    </span>
                    <span className="text-[10px] font-semibold text-on-surface-variant/50 block">Operational expenditures</span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  </div>
                </div>

                {/* KPI 4: Net Profit */}
                <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] text-on-surface-variant/75 font-semibold uppercase tracking-wider block">Net Profit</span>
                    <span className={`text-xl md:text-2xl font-extrabold tracking-tight block ${
                      plData.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}>
                      ₹{formatINR(plData.netProfit)}
                    </span>
                    <span className="text-[10px] font-semibold text-on-surface-variant/50 block">Cash minus expenses</span>
                  </div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    plData.netProfit >= 0 ? "bg-emerald-50" : "bg-rose-50"
                  }`}>
                    {plData.netProfit >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-rose-600" />
                    )}
                  </div>
                </div>

                {/* KPI 5: Profit Margin */}
                <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] text-on-surface-variant/75 font-semibold uppercase tracking-wider block">Net Margin</span>
                    <span className={`text-xl md:text-2xl font-extrabold tracking-tight block ${
                      plData.profitMargin >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}>
                      {plData.profitMargin.toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-semibold text-on-surface-variant/50 block">Percentage return on cash</span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Percent className="w-5 h-5 text-secondary" />
                  </div>
                </div>
              </div>

              {/* Chart Visualizing Monthly Trends */}
              <div className="bg-white p-6 rounded-xl border border-outline-variant/10 shadow-sm">
                <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 mb-6 font-sans">
                  <Calendar className="w-4 h-4 text-primary" />
                  Monthly Performance Trends (Last 6 Months)
                </h2>
                
                {plData.monthlyBreakdown.length === 0 ? (
                  <div className="py-12 text-center text-on-surface-variant">
                    <p className="text-xs font-semibold">No monthly data available for visualization.</p>
                  </div>
                ) : (
                  <div className="h-64 flex items-end gap-6 overflow-x-auto pb-4 pt-8 border-b border-outline-variant/15">
                    {/* Reverse order to display oldest to newest left-to-right */}
                    {[...plData.monthlyBreakdown].reverse().slice(-6).map((item) => {
                      const maxBarHeight = 160; // max px height
                      const revenueHeight = Math.max(2, (item.revenuePaid / chartScaleMax) * maxBarHeight);
                      const expenseHeight = Math.max(2, (item.expenses / chartScaleMax) * maxBarHeight);
                      const profitHeight = Math.max(0, (item.netProfit / chartScaleMax) * maxBarHeight);
                      const isProfitNegative = item.netProfit < 0;

                      return (
                        <div key={item.month} className="flex-1 flex flex-col items-center min-w-[70px]">
                          <div className="relative w-full h-[180px] flex items-end justify-center gap-1.5">
                            {/* Revenue Bar */}
                            <div 
                              style={{ height: `${revenueHeight}px` }} 
                              className="w-4 bg-teal-500 rounded-t-sm group relative cursor-pointer hover:bg-teal-600 transition-colors"
                            >
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap z-30">
                                Cash Recd: ₹{formatINR(item.revenuePaid)}
                              </div>
                            </div>
                            
                            {/* Expense Bar */}
                            <div 
                              style={{ height: `${expenseHeight}px` }} 
                              className="w-4 bg-red-400 rounded-t-sm group relative cursor-pointer hover:bg-red-500 transition-colors"
                            >
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap z-30">
                                Expense: ₹{formatINR(item.expenses)}
                              </div>
                            </div>

                            {/* Profit/Loss Bar */}
                            <div 
                              style={{ height: `${isProfitNegative ? 3 : profitHeight}px` }} 
                              className={`w-4 rounded-t-sm group relative cursor-pointer transition-colors ${
                                isProfitNegative ? "bg-rose-500" : "bg-emerald-500 hover:bg-emerald-600"
                              }`}
                            >
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap z-30">
                                Net: ₹{formatINR(item.netProfit)}
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-on-surface-variant mt-2 text-center whitespace-nowrap">
                            {formatMonthName(item.month)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex justify-center items-center gap-6 mt-4 text-xs font-semibold text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 bg-teal-500 rounded-sm"></div>
                    <span>Revenue (Cash)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 bg-red-400 rounded-sm"></div>
                    <span>Expenses</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 bg-emerald-500 rounded-sm"></div>
                    <span>Net Profit</span>
                  </div>
                </div>
              </div>

              {/* Detailed Monthly P&L Table */}
              <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-outline-variant/10">
                  <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider font-sans">
                    Statement Details by Month
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container border-b border-outline-variant/15 text-[11px] uppercase font-bold text-on-surface-variant">
                        <th className="px-6 py-4">Month</th>
                        <th className="px-6 py-4 text-right">Cash Collected (A)</th>
                        <th className="px-6 py-4 text-right">Total Billed (B)</th>
                        <th className="px-6 py-4 text-right">Expenses (C)</th>
                        <th className="px-6 py-4 text-right">Net Profit (A - C)</th>
                        <th className="px-6 py-4 text-right">Profit Margin %</th>
                        <th className="px-6 py-4">Top Expense Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10 font-medium">
                      {plData.monthlyBreakdown.map((item) => (
                        <tr key={item.month} className="hover:bg-surface-container-low/20 transition-colors">
                          <td className="px-6 py-5 text-on-surface font-bold text-[13px]">
                            {formatMonthName(item.month)}
                          </td>
                          <td className="px-6 py-5 text-right text-teal-600 font-mono text-[13px]">
                            ₹{formatINR(item.revenuePaid)}
                          </td>
                          <td className="px-6 py-5 text-right text-blue-600 font-mono text-[13px]">
                            ₹{formatINR(item.revenueBilled)}
                          </td>
                          <td className="px-6 py-5 text-right text-red-600 font-mono text-[13px]">
                            ₹{formatINR(item.expenses)}
                          </td>
                          <td className={`px-6 py-5 text-right font-bold font-mono text-[14px] ${
                            item.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}>
                            ₹{formatINR(item.netProfit)}
                          </td>
                          <td className={`px-6 py-5 text-right font-bold text-[13px] ${
                            item.profitMargin >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}>
                            {item.profitMargin.toFixed(1)}%
                          </td>
                          <td className="px-6 py-5 text-on-surface-variant text-[13px]">
                            {item.topExpenseCategory !== "None" ? (
                              <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 border border-slate-200 text-secondary">
                                {item.topExpenseCategory}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-normal">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AdminAuthGuard>
      <ProfitLossPage />
    </AdminAuthGuard>
  );
}
