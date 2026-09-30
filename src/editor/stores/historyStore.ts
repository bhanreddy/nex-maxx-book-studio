import { create } from "zustand";

export interface HistoryAction {
  id: string;
  description: string;
  timestamp: number;
  undo: () => void;
  redo: () => void;
}

interface HistoryState {
  past: HistoryAction[];
  future: HistoryAction[];
  isApplying: boolean;
  pushAction: (action: Omit<HistoryAction, "id" | "timestamp">) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  isApplying: false,
  canUndo: false,
  canRedo: false,

  pushAction: (action) => {
    if (get().isApplying) return;
    const newAction: HistoryAction = {
      ...action,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    set((state) => {
      const updatedPast = [...state.past, newAction];
      // Keep max 50 actions to maintain lightweight memory footprint
      if (updatedPast.length > 50) updatedPast.shift();
      return {
        past: updatedPast,
        future: [],
        canUndo: true,
        canRedo: false,
      };
    });
  },

  undo: () => {
    const { past, future, isApplying } = get();
    if (isApplying || past.length === 0) return;
    const action = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    set({ isApplying: true });
    try {
      action.undo();
    } finally {
      set({
        past: newPast,
        future: [action, ...future],
        isApplying: false,
        canUndo: newPast.length > 0,
        canRedo: true,
      });
    }
  },

  redo: () => {
    const { past, future, isApplying } = get();
    if (isApplying || future.length === 0) return;
    const action = future[0];
    const newFuture = future.slice(1);

    set({ isApplying: true });
    try {
      action.redo();
    } finally {
      set({
        past: [...past, action],
        future: newFuture,
        isApplying: false,
        canUndo: true,
        canRedo: newFuture.length > 0,
      });
    }
  },

  clearHistory: () => {
    set({ past: [], future: [], canUndo: false, canRedo: false });
  },
}));
