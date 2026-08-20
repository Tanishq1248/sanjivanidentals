"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Filter, 
  Search, 
  IndianRupee, 
  Calendar, 
  Tag, 
  Briefcase, 
  Menu,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Building
} from "lucide-react";
import { AdminAuthGuard } from "../../../../components/auth/AdminAuthGuard";
import { useAuth } from "../../../../lib/context/AuthContext";
import { useSidebarStore } from "../../../../lib/store/useSidebarStore";
import { Sidebar } from "../../../../components/admin/Sidebar";
import { queryKeys } from "../../../../lib/query/queryKeys";
import { 
  getExpenses, 
  addExpense, 
  updateExpense, 
  deleteExpense 
} from "../../../../lib/services/expenseService";
import { EXPENSE_CATEGORIES, Expense, ExpenseFormData } from "../../../../lib/types";

// Helper to format currency
function formatINR(val: number) {
  if (isNaN(val)) return "0";
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

const PAYMENT_METHODS = ["Cash", "Card", "UPI", "Bank Transfer", "Cheque"];

function ExpensesPage() {
  const { user } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();
  const queryClient = useQueryClient();

  // Local State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("All");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formPaymentMethod, setFormPaymentMethod] = useState("Cash");
  const [formVendor, setFormVendor] = useState("");
  const [formNotes, setFormNotes] = useState("");
  
  // Form Errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Toast notifications
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Queries
  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: queryKeys.expenses.all,
    queryFn: getExpenses,
    staleTime: 30_000,
  });

  // Mutations
  const addMutation = useMutation({
    mutationFn: (data: ExpenseFormData) => addExpense(data, user?.email || "Admin"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.stats });
      showToast("Expense recorded successfully.");
      closeModal();
    },
    onError: (err) => {
      console.error(err);
      showToast("Error adding expense.");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExpenseFormData }) => updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.stats });
      showToast("Expense updated successfully.");
      closeModal();
    },
    onError: (err) => {
      console.error(err);
      showToast("Error updating expense.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.stats });
      showToast("Expense deleted successfully.");
    },
    onError: (err) => {
      console.error(err);
      showToast("Error deleting expense.");
    }
  });

  // Open modal for add
  const openAddModal = () => {
    setEditingExpense(null);
    setFormTitle("");
    setFormCategory(EXPENSE_CATEGORIES[0]);
    setFormAmount("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormPaymentMethod("Cash");
    setFormVendor("");
    setFormNotes("");
    setValidationErrors({});
    setIsModalOpen(true);
  };

  // Open modal for edit
  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setFormTitle(expense.expenseTitle);
    setFormCategory(expense.category);
    setFormAmount(String(expense.amount));
    setFormDate(expense.expenseDate);
    setFormPaymentMethod(expense.paymentMethod || "Cash");
    setFormVendor(expense.vendor || "");
    setFormNotes(expense.notes || "");
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const errors: Record<string, string> = {};
    if (!formTitle.trim()) errors.title = "Title is required";
    if (!formCategory) errors.category = "Category is required";
    if (!formAmount || isNaN(Number(formAmount)) || Number(formAmount) <= 0) {
      errors.amount = "Enter a valid positive number";
    }
    if (!formDate) errors.date = "Date is required";
    if (!formPaymentMethod) errors.paymentMethod = "Payment method is required";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const payload: ExpenseFormData = {
      expenseTitle: formTitle.trim(),
      category: formCategory,
      amount: Number(formAmount),
      expenseDate: formDate,
      paymentMethod: formPaymentMethod,
      vendor: formVendor.trim() || undefined,
      notes: formNotes.trim() || undefined,
    };

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data: payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this expense record?")) {
      deleteMutation.mutate(id);
    }
  };

  // Memoized KPIs and Filters
  const currentMonthYearStr = useMemo(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}`; // "YYYY-MM"
  }, []);

  const kpis = useMemo(() => {
    let totalAll = 0;
    let totalThisMonth = 0;
    const catMap: Record<string, number> = {};
    const vendors = new Set<string>();

    expenses.forEach((exp) => {
      totalAll += exp.amount;
      
      // Check if this month
      if (exp.expenseDate.startsWith(currentMonthYearStr)) {
        totalThisMonth += exp.amount;
      }

      // Group categories
      catMap[exp.category] = (catMap[exp.category] || 0) + exp.amount;

      // Track vendors
      if (exp.vendor && exp.vendor.trim()) {
        vendors.add(exp.vendor.trim().toLowerCase());
      }
    });

    // Find top category
    let topCat = "None";
    let maxCatVal = 0;
    Object.entries(catMap).forEach(([cat, val]) => {
      if (val > maxCatVal) {
        maxCatVal = val;
        topCat = cat;
      }
    });

    return {
      totalAll,
      totalThisMonth,
      topCategory: topCat === "None" ? "N/A" : `${topCat} (₹${formatINR(maxCatVal)})`,
      uniqueVendors: vendors.size,
    };
  }, [expenses, currentMonthYearStr]);

  // Filtering
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesSearch = 
        exp.expenseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.vendor && exp.vendor.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === "All" || exp.category === selectedCategory;
      const matchesPayment = selectedPaymentMethod === "All" || exp.paymentMethod === selectedPaymentMethod;
      return matchesSearch && matchesCategory && matchesPayment;
    });
  }, [expenses, searchTerm, selectedCategory, selectedPaymentMethod]);

  return (
    <div className="min-h-screen flex bg-[#f2f5f8] font-sans">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0 sticky top-0 h-screen shadow-2xs z-30">
        <Sidebar currentPage="expenses" />
      </div>

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[220px] shadow-level-2 transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          currentPage="expenses"
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
              <TrendingDown className="w-5 h-5 text-red-600" />
              <h1 className="text-lg font-bold text-primary font-sans leading-tight">Expenses Registry</h1>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-red-600 text-white text-xs md:text-sm font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            Add Expense
          </button>
        </header>

        {/* Content Body */}
        <main className="flex-grow p-4 md:p-8 space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Monthly Total */}
            <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] text-on-surface-variant/75 font-semibold uppercase tracking-wider block">Expenses (This Month)</span>
                <span className="text-2xl md:text-3xl font-extrabold text-red-600 tracking-tight block">
                  ₹{formatINR(kpis.totalThisMonth)}
                </span>
                <span className="text-[10px] font-semibold text-on-surface-variant/50 block">Current month total spending</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>

            {/* KPI 2: Total Expenses */}
            <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] text-on-surface-variant/75 font-semibold uppercase tracking-wider block">Total Expenses (All Time)</span>
                <span className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight block">
                  ₹{formatINR(kpis.totalAll)}
                </span>
                <span className="text-[10px] font-semibold text-on-surface-variant/50 block">Cumulative all-time expenses</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <IndianRupee className="w-5 h-5 text-secondary" />
              </div>
            </div>

            {/* KPI 3: Top Category */}
            <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between">
              <div className="space-y-1 min-w-0">
                <span className="text-[11px] text-on-surface-variant/75 font-semibold uppercase tracking-wider block">Top Category</span>
                <span className="text-base font-extrabold text-on-surface truncate block" title={kpis.topCategory}>
                  {kpis.topCategory}
                </span>
                <span className="text-[10px] font-semibold text-amber-600 block uppercase">Most capital spent category</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5 text-amber-500" />
              </div>
            </div>

            {/* KPI 4: Active Vendors */}
            <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] text-on-surface-variant/75 font-semibold uppercase tracking-wider block">Unique Vendors</span>
                <span className="text-2xl md:text-3xl font-extrabold text-teal-600 tracking-tight block">
                  {kpis.uniqueVendors}
                </span>
                <span className="text-[10px] font-semibold text-teal-600 block uppercase">Outlets & Suppliers</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                <Building className="w-5 h-5 text-teal-600" />
              </div>
            </div>
          </div>

          {/* Filtering and Search Controls */}
          <div className="bg-white p-4 rounded-xl border border-outline-variant/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-on-surface-variant/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-outline-variant/35 rounded-lg text-sm bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-on-surface-variant" />
                <span className="text-xs font-semibold text-on-surface-variant">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1.5 border border-outline-variant/35 rounded-lg text-xs bg-white text-on-surface focus:outline-none"
                >
                  <option value="All">All Categories</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-on-surface-variant">Payment:</span>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="px-2.5 py-1.5 border border-outline-variant/35 rounded-lg text-xs bg-white text-on-surface focus:outline-none"
                >
                  <option value="All">All Methods</option>
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm}>{pm}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-on-surface-variant">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm font-semibold">Loading expenses...</p>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="py-16 text-center text-on-surface-variant">
                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30 text-secondary" />
                <p className="text-sm font-semibold">No expense records found</p>
                <p className="text-xs mt-1 text-on-surface-variant/75">
                  Try adjusting your filters or record a new expense.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container border-b border-outline-variant/15 text-[11px] uppercase font-bold text-on-surface-variant">
                      <th className="px-6 py-4">Expense Title</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Vendor</th>
                      <th className="px-6 py-4">Payment Method</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-surface-container-low/20 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-on-surface text-[13px]">{exp.expenseTitle}</p>
                            {exp.notes && (
                              <p className="text-[11px] text-on-surface-variant/80 italic mt-0.5 line-clamp-1">
                                {exp.notes}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-secondary border border-slate-200">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-on-surface-variant text-[13px]">
                          {exp.expenseDate}
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant font-medium text-[13px]">
                          {exp.vendor || <span className="text-gray-400 font-normal">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-on-surface-variant">
                            {exp.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-red-600 font-mono text-[14px]">
                          ₹{formatINR(exp.amount)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(exp)}
                              className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-variant/30 transition-colors cursor-pointer"
                              title="Edit Expense"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(exp.id)}
                              className="p-1.5 text-on-surface-variant hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
            <header className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
              <h2 className="text-base font-bold text-primary flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                {editingExpense ? "Edit Expense Entry" : "Record New Expense"}
              </h2>
              <button 
                onClick={closeModal} 
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </header>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-grow max-h-[80vh]">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rent Payment, Purchase of Dental Implants"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm bg-white text-on-surface focus:outline-none ${
                    validationErrors.title ? "border-red-500" : "border-outline-variant/35"
                  }`}
                />
                {validationErrors.title && (
                  <p className="text-[10px] font-semibold text-red-600 mt-1">{validationErrors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant/35 rounded-lg text-sm bg-white text-on-surface focus:outline-none"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                    Amount (INR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-white text-on-surface focus:outline-none font-mono ${
                      validationErrors.amount ? "border-red-500" : "border-outline-variant/35"
                    }`}
                  />
                  {validationErrors.amount && (
                    <p className="text-[10px] font-semibold text-red-600 mt-1">{validationErrors.amount}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-white text-on-surface focus:outline-none ${
                      validationErrors.date ? "border-red-500" : "border-outline-variant/35"
                    }`}
                  />
                  {validationErrors.date && (
                    <p className="text-[10px] font-semibold text-red-600 mt-1">{validationErrors.date}</p>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                    Payment Method *
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant/35 rounded-lg text-sm bg-white text-on-surface focus:outline-none"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                  Vendor / Paid To (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Colgate Palmolive, Landlord Name, Lab Corp"
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant/35 rounded-lg text-sm bg-white text-on-surface focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                  Additional Notes (Optional)
                </label>
                <textarea
                  placeholder="Enter details, receipt info, etc."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-outline-variant/35 rounded-lg text-sm bg-white text-on-surface focus:outline-none resize-y"
                />
              </div>

              <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-outline-variant/40 text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-1.5 bg-primary text-white text-sm font-bold py-2 px-5 rounded-lg hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {editingExpense ? "Update Entry" : "Save Entry"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-4 md:right-6 z-50 bg-on-surface text-surface text-sm font-medium px-4 py-3 rounded-xl shadow-level-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AdminAuthGuard>
      <ExpensesPage />
    </AdminAuthGuard>
  );
}
