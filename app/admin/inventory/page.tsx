"use client";

import React, { useState } from "react";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Menu,
  TrendingDown,
  Layers,
} from "lucide-react";
import { AdminAuthGuard } from "../../../components/auth/AdminAuthGuard";
import { Sidebar } from "../../../components/admin/Sidebar";
import { useSidebarStore } from "../../../lib/store/useSidebarStore";

interface InventoryItem {
  id: string;
  name: string;
  category: "Consumables" | "Restorative" | "Surgical" | "Endodontics" | "PPE & Hygiene";
  quantity: number;
  unit: string;
  minThreshold: number;
  supplier: string;
  costPerUnit: number;
  lastRestocked: string;
}

const SAMPLE_INVENTORY: InventoryItem[] = [
  {
    id: "inv-1",
    name: "3M Filtek Z250 Composite (Shade A2)",
    category: "Restorative",
    quantity: 8,
    unit: "Syringes",
    minThreshold: 5,
    supplier: "DentalMart India",
    costPerUnit: 1450,
    lastRestocked: "2026-08-10",
  },
  {
    id: "inv-2",
    name: "Lignocaine 2% with Adrenaline (1:80000)",
    category: "Surgical",
    quantity: 3,
    unit: "Boxes (50 amp)",
    minThreshold: 4,
    supplier: "MedSupply Healthcare",
    costPerUnit: 680,
    lastRestocked: "2026-07-28",
  },
  {
    id: "inv-3",
    name: "Protaper Gold Rotary Files (SX-F3)",
    category: "Endodontics",
    quantity: 12,
    unit: "Packs (6 pcs)",
    minThreshold: 6,
    supplier: "Dentsply Sirona",
    costPerUnit: 2200,
    lastRestocked: "2026-08-14",
  },
  {
    id: "inv-4",
    name: "Nitrile Examination Gloves (Medium)",
    category: "PPE & Hygiene",
    quantity: 2,
    unit: "Boxes (100 pcs)",
    minThreshold: 5,
    supplier: "SafeCare Supplies",
    costPerUnit: 340,
    lastRestocked: "2026-07-20",
  },
  {
    id: "inv-5",
    name: "Alginate Impression Material (Fast Set)",
    category: "Consumables",
    quantity: 15,
    unit: "Packs (450g)",
    minThreshold: 6,
    supplier: "Zhermack Distribution",
    costPerUnit: 480,
    lastRestocked: "2026-08-05",
  },
];

export default function InventoryPage() {
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const filteredItems = SAMPLE_INVENTORY.filter((item) => {
    if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.supplier.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const lowStockCount = SAMPLE_INVENTORY.filter((item) => item.quantity <= item.minThreshold).length;

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
          <Sidebar currentPage="inventory" />
        </div>

        {/* Mobile Sidebar Drawer */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-[220px] shadow-2xl transition-transform duration-300 md:hidden ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar currentPage="inventory" onClose={() => setSidebarOpen(false)} />
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
                  <Package className="w-5 h-5 text-indigo-600" />
                  Clinic Inventory & Consumables
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Monitor stock levels, dental materials, supplier orders, and expiry alerts
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 space-y-6">
            {/* KPI Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 block uppercase">Total Catalog Items</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{SAMPLE_INVENTORY.length} Items</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-rose-600 block uppercase flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Low Stock Alerts
                </span>
                <span className="text-2xl font-black text-rose-600 mt-1 block">{lowStockCount} Requires Restock</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-emerald-600 block uppercase">Stock Value</span>
                <span className="text-2xl font-black text-emerald-700 mt-1 block">
                  ₹{SAMPLE_INVENTORY.reduce((acc, it) => acc + it.quantity * it.costPerUnit, 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search materials, brand, supplier..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {["ALL", "Restorative", "Endodontics", "Surgical", "PPE & Hygiene", "Consumables"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        categoryFilter === cat
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-3.5">Item Name</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">In Stock</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Supplier</th>
                      <th className="p-3.5 text-right">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredItems.map((item) => {
                      const isLow = item.quantity <= item.minThreshold;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="p-3.5 font-bold text-slate-900">{item.name}</td>
                          <td className="p-3.5 text-slate-600 font-semibold">{item.category}</td>
                          <td className="p-3.5 font-mono font-bold text-slate-900">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="p-3.5">
                            {isLow ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3 text-rose-600" /> Low Stock
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit block">
                                Optimal
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-600">{item.supplier}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                            ₹{item.costPerUnit.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })}
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
