import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Expense, ExpenseFormData, Invoice } from "../types";
import { COLLECTIONS, DEFAULT_CLINIC_ID } from "./firestoreConfig";
import { getInvoices } from "./invoiceService";

const COLLECTION = COLLECTIONS.EXPENSES;
const expensesRef = collection(db, COLLECTION);

/** Fetch all expenses, ordered by expenseDate descending. */
export async function getExpenses(): Promise<Expense[]> {
  const q = query(expensesRef, orderBy("expenseDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Expense);
}

/** Fetch a single expense by document ID. */
export async function getExpenseById(id: string): Promise<Expense | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Expense;
}

/** Create a new expense record. */
export async function addExpense(
  data: ExpenseFormData,
  createdByEmail: string
): Promise<string> {
  const clinicId = (data as any).clinicId;

  const now = Timestamp.now();
  const docRef = await addDoc(expensesRef, {
    ...data,
    createdBy: createdByEmail || "Admin",
    clinicId: clinicId || "",
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

/** Update fields on an existing expense record. */
export async function updateExpense(
  id: string,
  data: Partial<ExpenseFormData>
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/** Delete an expense record. */
export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/* ─── Financial Calculations ─── */

export interface MonthlyFinancialRecord {
  month: string; // YYYY-MM
  revenuePaid: number;
  revenueBilled: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
  topExpenseCategory: string;
}

export interface FinancialStats {
  revenuePaid: number;   // Total actual collected
  revenueBilled: number; // Total invoiced
  expenses: number;      // Total operational costs
  netProfit: number;     // Billed/Paid minus expenses (using Paid for cash flow)
  profitMargin: number;
  topCategory: string;
  mostExpensiveMonth: string;
  monthlyBreakdown: MonthlyFinancialRecord[];
}

export async function getFinancialSummary(): Promise<FinancialStats> {
  // 1. Fetch all invoices and expenses in parallel
  const [invoices, expenses] = await Promise.all([
    getInvoices(),
    getExpenses(),
  ]);

  // 2. Compute aggregate values
  let totalRevenuePaid = 0;
  let totalRevenueBilled = 0;
  
  invoices.forEach((inv) => {
    totalRevenueBilled += inv.total || inv.amount || 0;
    const history = inv.paymentHistory || [];
    if (history.length > 0) {
      history.forEach((pay) => {
        const received = pay.amountReceived ?? pay.amount ?? 0;
        if (pay.paymentType !== "Generated" && received > 0) {
          totalRevenuePaid += received;
        }
      });
    } else if (inv.paymentStatus === "Paid" || inv.status === "Paid" || inv.paymentStatus === "PAID" || inv.status === "PAID") {
      totalRevenuePaid += inv.total || inv.amount || 0;
    }
  });

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const netProfit = totalRevenuePaid - totalExpenses;
  const profitMargin = totalRevenuePaid > 0 ? (netProfit / totalRevenuePaid) * 100 : 0;

  // 3. Aggregate by month (keys: YYYY-MM)
  const monthMap = new Map<string, { revenuePaid: number; revenueBilled: number; expensesList: Expense[] }>();

  invoices.forEach((inv) => {
    // Billed/Accrual goes to invoice date month
    const billedMonth = (inv.invoiceDate || "").substring(0, 7); // "YYYY-MM"
    if (billedMonth && billedMonth.length === 7) {
      const existing = monthMap.get(billedMonth) ?? { revenuePaid: 0, revenueBilled: 0, expensesList: [] };
      existing.revenueBilled += inv.total || inv.amount || 0;
      monthMap.set(billedMonth, existing);
    }

    // Cash received goes to payment date month
    const history = inv.paymentHistory || [];
    if (history.length > 0) {
      history.forEach((pay) => {
        const received = pay.amountReceived ?? pay.amount ?? 0;
        if (pay.paymentType !== "Generated" && received > 0) {
          const payMonth = (pay.paymentDate || "").substring(0, 7);
          if (payMonth && payMonth.length === 7) {
            const existing = monthMap.get(payMonth) ?? { revenuePaid: 0, revenueBilled: 0, expensesList: [] };
            existing.revenuePaid += received;
            monthMap.set(payMonth, existing);
          }
        }
      });
    } else if (inv.paymentStatus === "Paid" || inv.status === "Paid" || inv.paymentStatus === "PAID" || inv.status === "PAID") {
      const payMonth = (inv.invoiceDate || "").substring(0, 7);
      if (payMonth && payMonth.length === 7) {
        const existing = monthMap.get(payMonth) ?? { revenuePaid: 0, revenueBilled: 0, expensesList: [] };
        existing.revenuePaid += inv.total || inv.amount || 0;
        monthMap.set(payMonth, existing);
      }
    }
  });

  expenses.forEach((exp) => {
    const month = (exp.expenseDate || "").substring(0, 7); // "YYYY-MM"
    if (!month || month.length < 7) return;
    const existing = monthMap.get(month) ?? { revenuePaid: 0, revenueBilled: 0, expensesList: [] };
    existing.expensesList.push(exp);
    monthMap.set(month, existing);
  });

  // Calculate stats per month
  const monthlyBreakdown: MonthlyFinancialRecord[] = [];
  let highestMonthlyExpense = 0;
  let mostExpensiveMonth = "—";

  monthMap.forEach((data, month) => {
    const monthExpTotal = data.expensesList.reduce((sum, e) => sum + (e.amount || 0), 0);
    if (monthExpTotal > highestMonthlyExpense) {
      highestMonthlyExpense = monthExpTotal;
      mostExpensiveMonth = month;
    }

    // Compute top category for this specific month
    const categoryMap = new Map<string, number>();
    data.expensesList.forEach((e) => {
      categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + e.amount);
    });

    let topCat = "None";
    let topAmt = 0;
    categoryMap.forEach((amt, cat) => {
      if (amt > topAmt) {
        topAmt = amt;
        topCat = cat;
      }
    });

    const net = data.revenuePaid - monthExpTotal;
    const margin = data.revenuePaid > 0 ? (net / data.revenuePaid) * 100 : 0;

    monthlyBreakdown.push({
      month,
      revenuePaid: data.revenuePaid,
      revenueBilled: data.revenueBilled,
      expenses: monthExpTotal,
      netProfit: net,
      profitMargin: margin,
      topExpenseCategory: topCat,
    });
  });

  // Sort monthly breakdown by month descending
  monthlyBreakdown.sort((a, b) => b.month.localeCompare(a.month));

  // 4. Compute overall top category
  const overallCategoryMap = new Map<string, number>();
  expenses.forEach((e) => {
    overallCategoryMap.set(e.category, (overallCategoryMap.get(e.category) ?? 0) + e.amount);
  });

  let topCategory = "None";
  let topCategoryAmt = 0;
  overallCategoryMap.forEach((amt, cat) => {
    if (amt > topCategoryAmt) {
      topCategoryAmt = amt;
      topCategory = cat;
    }
  });

  return {
    revenuePaid: totalRevenuePaid,
    revenueBilled: totalRevenueBilled,
    expenses: totalExpenses,
    netProfit,
    profitMargin,
    topCategory,
    mostExpensiveMonth,
    monthlyBreakdown,
  };
}
