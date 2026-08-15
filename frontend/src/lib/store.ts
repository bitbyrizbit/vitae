import { create } from "zustand";

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