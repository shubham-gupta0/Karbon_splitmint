import { create } from "zustand";

export const useExpenseStore = create((set) => ({
  expenses: [],
  filters: {
    search: "",
    participantId: null,
    dateFrom: null,
    dateTo: null,
    sortBy: "date",
    sortOrder: "desc",
  },

  setExpenses: (expenses) => set({ expenses }),

  addExpense: (expense) =>
    set((state) => ({ expenses: [expense, ...state.expenses] })),

  updateExpense: (id, updatedData) =>
    set((state) => ({
      expenses: state.expenses.map((e) =>
        e.id === id ? { ...e, ...updatedData } : e,
      ),
    })),

  deleteExpense: (id) =>
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    })),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  clearFilters: () =>
    set({
      filters: {
        search: "",
        participantId: null,
        dateFrom: null,
        dateTo: null,
        sortBy: "date",
        sortOrder: "desc",
      },
    }),

  clearExpenses: () => set({ expenses: [] }),
}));
