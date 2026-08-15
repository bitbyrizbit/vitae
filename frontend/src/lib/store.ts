import { create } from "zustand";

/* ----------------------------------------------------------------
   Session store - auth state + localStorage persistence
   ---------------------------------------------------------------- */

type Session = {
  token: string | null;
  role: string | null;
  name: string | null;
  setSession: (token: string, role: string, name: string) => void;
  clearSession: () => void;
  hydrate: () => void;
};

export const useSession = create<Session>((set) => ({
  token: null,
  role: null,
  name: null,
  setSession: (token, role, name) => {
    localStorage.setItem("vitae_token", token);
    localStorage.setItem("vitae_role", role);
    localStorage.setItem("vitae_name", name);
    set({ token, role, name });
  },
  clearSession: () => {
    localStorage.removeItem("vitae_token");
    localStorage.removeItem("vitae_role");
    localStorage.removeItem("vitae_name");
    set({ token: null, role: null, name: null });
  },
  hydrate: () => {
    const token = localStorage.getItem("vitae_token");
    const role = localStorage.getItem("vitae_role");
    const name = localStorage.getItem("vitae_name");
    if (token) set({ token, role, name });
  },
}));

/* ----------------------------------------------------------------
   Toast store - lightweight notification system
   ---------------------------------------------------------------- */

type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
};

type ToastStore = {
  toasts: Toast[];
  addToast: (message: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
};

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = "info") => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));