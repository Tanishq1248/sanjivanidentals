import { create } from "zustand";

type TabKey = "Today" | "Upcoming" | "History";

interface DashboardState {
  activeTab: TabKey;
  search: string;
  toast: string | null;
  setActiveTab: (tab: TabKey) => void;
  setSearch: (search: string) => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

let toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

export const useDashboardStore = create<DashboardState>((set) => ({
  activeTab: "Today",
  search: "",
  toast: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearch: (search) => set({ search }),
  showToast: (msg) => {
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }
    set({ toast: msg });
    toastTimeoutId = setTimeout(() => {
      set({ toast: null });
    }, 3000);
  },
  clearToast: () => {
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }
    set({ toast: null });
  },
}));
