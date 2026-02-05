import { create } from "zustand";

export const useGroupStore = create((set) => ({
  selectedGroup: null,
  groups: [],

  setSelectedGroup: (group) => set({ selectedGroup: group }),

  setGroups: (groups) => set({ groups }),

  addGroup: (group) => set((state) => ({ groups: [...state.groups, group] })),

  updateGroup: (id, updatedData) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === id ? { ...g, ...updatedData } : g,
      ),
      selectedGroup:
        state.selectedGroup?.id === id
          ? { ...state.selectedGroup, ...updatedData }
          : state.selectedGroup,
    })),

  deleteGroup: (id) =>
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== id),
      selectedGroup:
        state.selectedGroup?.id === id ? null : state.selectedGroup,
    })),

  clearGroups: () => set({ groups: [], selectedGroup: null }),
}));
