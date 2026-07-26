import { create } from "zustand";

type AuthStore = {
  isAuthenticated: boolean;
  setAuthenticated(isAuthenticated: boolean): void;
};

export const useAuthStore = create<AuthStore>(function authStore(set) {
  return {
    isAuthenticated: false,

    setAuthenticated(isAuthenticated) {
      set({ isAuthenticated });
    },
  };
});
