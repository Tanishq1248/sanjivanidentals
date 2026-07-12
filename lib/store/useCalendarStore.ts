import { create } from "zustand";

export type CalendarView = "day" | "week" | "month";

/** Returns today's date as YYYY-MM-DD in local timezone. */
function localToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Add/subtract days from a YYYY-MM-DD string. */
export function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Get the Monday of the week containing dateStr. */
export function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const dow = d.getDay(); // 0=Sun,1=Mon,...,6=Sat
  const diff = dow === 0 ? -6 : 1 - dow; // shift to Monday
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Get the Sunday of the week containing dateStr. */
export function getWeekEnd(dateStr: string): string {
  return shiftDate(getWeekStart(dateStr), 6);
}

/** Get the first day of the month for a given YYYY-MM-DD. */
export function getMonthStart(dateStr: string): string {
  const [y, m] = dateStr.split("-");
  return `${y}-${m}-01`;
}

/** Get the last day of the month for a given YYYY-MM-DD. */
export function getMonthEnd(dateStr: string): string {
  const [y, m] = dateStr.split("-");
  const lastDay = new Date(Number(y), Number(m), 0).getDate();
  return `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
}

interface CalendarState {
  view: CalendarView;
  selectedDate: string; // YYYY-MM-DD
  setView: (view: CalendarView) => void;
  setSelectedDate: (date: string) => void;
  goToToday: () => void;
  goToPrev: () => void;
  goToNext: () => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  view: "month",
  selectedDate: localToday(),

  setView: (view) => set({ view }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  goToToday: () => set({ selectedDate: localToday() }),

  goToPrev: () => {
    const { view, selectedDate } = get();
    if (view === "day") {
      set({ selectedDate: shiftDate(selectedDate, -1) });
    } else if (view === "week") {
      set({ selectedDate: shiftDate(getWeekStart(selectedDate), -7) });
    } else {
      // month — go to same day of previous month
      const d = new Date(selectedDate + "T00:00:00");
      d.setMonth(d.getMonth() - 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      set({ selectedDate: `${y}-${m}-${day}` });
    }
  },

  goToNext: () => {
    const { view, selectedDate } = get();
    if (view === "day") {
      set({ selectedDate: shiftDate(selectedDate, 1) });
    } else if (view === "week") {
      set({ selectedDate: shiftDate(getWeekStart(selectedDate), 7) });
    } else {
      const d = new Date(selectedDate + "T00:00:00");
      d.setMonth(d.getMonth() + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      set({ selectedDate: `${y}-${m}-${day}` });
    }
  },
}));
