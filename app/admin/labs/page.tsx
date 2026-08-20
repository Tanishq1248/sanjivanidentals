"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  Menu,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { AdminAuthGuard } from "../../../components/auth/AdminAuthGuard";
import { Sidebar } from "../../../components/admin/Sidebar";
import { useSidebarStore } from "../../../lib/store/useSidebarStore";

interface LabOrder {
  id: string;
  orderNumber: string;
  patientName: string;
  patientPhone: string;
  labName: string;
  prosthesisType: string;
  toothNumber: string;
  shade: string;
  sentDate: string;
  expectedDate: string;
  status: "Sent to Lab" | "In Production" | "Received" | "Fitted";
  cost: number;
}

const SAMPLE_LAB_ORDERS: LabOrder[] = [
  {
    id: "lab-101",
    orderNumber: "LAB-2026-089",
    patientName: "Anil Deshmukh",
    patientPhone: "+91 98220 11234",
    labName: "Precision Dental Ceramics",
    prosthesisType: "Zirconia Crown (Monolithic)",
    toothNumber: "#16",
    shade: "A2",
    sentDate: "2026-08-18",
    expectedDate: "2026-08-23",
    status: "In Production",
    cost: 3200,
  },
  {
    id: "lab-102",
    orderNumber: "LAB-2026-090",
    patientName: "Priya Sharma",
    patientPhone: "+91 98450 67890",
    labName: "SmileAlign Ortho Labs",
    prosthesisType: "Clear Aligner Stage 1-4",
    toothNumber: "Upper & Lower",
    shade: "Natural",
    sentDate: "2026-08-15",
    expectedDate: "2026-08-21",
    status: "Received",
    cost: 14500,
  },
  {
    id: "lab-103",
    orderNumber: "LAB-2026-091",
    patientName: "Sunil Joshi",
    patientPhone: "+91 97654 33211",
    labName: "Apex Dental Milling",
    prosthesisType: "PFM 3-Unit Bridge",
    toothNumber: "#45-#47",
    shade: "A3",
    sentDate: "2026-08-19",
    expectedDate: "2026-08-25",
    status: "Sent to Lab",
    cost: 4800,
  },
  {
    id: "lab-104",
    orderNumber: "LAB-2026-088",
    patientName: "Meena Kulkarni",
    patientPhone: "+91 99123 44556",
    labName: "Precision Dental Ceramics",
    prosthesisType: "E.max Ceramic Veneer",
    toothNumber: "#11, #21",
    shade: "BL2",
    sentDate: "2026-08-12",
    expectedDate: "2026-08-17",
    status: "Fitted",
    cost: 7600,
  },
];

export default function LabOrdersPage() {
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredOrders = SAMPLE_LAB_ORDERS.filter((order) => {
    if (statusFilter !== "ALL" && order.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      order.patientName.toLowerCase().includes(q) ||
      order.orderNumber.toLowerCase().includes(q) ||
      order.prosthesisType.toLowerCase().includes(q) ||
      order.labName.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: LabOrder["status"]) => {
    switch (status) {
      case "Sent to Lab":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "In Production":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Received":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Fitted":
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <AdminAuthGuard>
      <div className="min-h-screen flex bg-[#f8fafc] font-sans">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Desktop Sidebar */}
        <div className="hidden md:flex shrink-0 sticky top-0 h-screen shadow-2xs z-30">
          <Sidebar currentPage="labs" />
        </div>

        {/* Mobile Sidebar Drawer */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-[220px] shadow-2xl transition-transform duration-300 md:hidden ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar currentPage="labs" onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700 shrink-0 cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-base md:text-lg font-black text-slate-900 leading-tight flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-indigo-600" />
                  Dental Lab Orders & Prosthetics
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Track crowns, bridges, aligners, and dental work with partner labs
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 block uppercase">Total Lab Orders</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{SAMPLE_LAB_ORDERS.length}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-purple-600 block uppercase">In Production</span>
                <span className="text-2xl font-black text-purple-700 mt-1 block">
                  {SAMPLE_LAB_ORDERS.filter((o) => o.status === "In Production").length}
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-emerald-600 block uppercase">Received in Clinic</span>
                <span className="text-2xl font-black text-emerald-700 mt-1 block">
                  {SAMPLE_LAB_ORDERS.filter((o) => o.status === "Received").length}
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 block uppercase">Completed / Fitted</span>
                <span className="text-2xl font-black text-slate-700 mt-1 block">
                  {SAMPLE_LAB_ORDERS.filter((o) => o.status === "Fitted").length}
                </span>
              </div>
            </div>

            {/* Filter & Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by patient, order ID, lab, or prosthesis..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {["ALL", "Sent to Lab", "In Production", "Received", "Fitted"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        statusFilter === st
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {st === "ALL" ? "All Orders" : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-3.5">Order ID</th>
                      <th className="p-3.5">Patient</th>
                      <th className="p-3.5">Lab Partner</th>
                      <th className="p-3.5">Prosthesis & Shade</th>
                      <th className="p-3.5">Dates</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Lab Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/70">
                        <td className="p-3.5 font-bold font-mono text-indigo-600">{order.orderNumber}</td>
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{order.patientName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{order.patientPhone}</p>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">{order.labName}</td>
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{order.prosthesisType}</p>
                          <p className="text-[10px] text-slate-500">
                            Tooth: {order.toothNumber} • Shade: <strong className="text-slate-800">{order.shade}</strong>
                          </p>
                        </td>
                        <td className="p-3.5 text-[11px] text-slate-600">
                          <p>Sent: {order.sentDate}</p>
                          <p className="font-semibold text-slate-900">Due: {order.expectedDate}</p>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-bold font-mono text-slate-900">₹{order.cost.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
