import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchStaffMe, loginStaff } from "../api/jewelryApi";
import type { StaffUser } from "../types/models";

const STAFF_TOKEN_KEY = "jewelry_staff_token";

type StaffAuthContextValue = {
  token: string | null;
  staff: StaffUser | null;
  loading: boolean;
  signInStaff: (email: string, password: string) => Promise<void>;
  signOutStaff: () => Promise<void>;
  refreshStaff: () => Promise<void>;
};

const StaffAuthContext = createContext<StaffAuthContextValue | undefined>(undefined);

export function StaffAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(STAFF_TOKEN_KEY);
        if (cancelled) return;
        if (stored) setToken(stored);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setStaff(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchStaffMe(token);
        if (!cancelled) setStaff(me);
      } catch {
        if (!cancelled) {
          setToken(null);
          setStaff(null);
          await SecureStore.deleteItemAsync(STAFF_TOKEN_KEY);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const signInStaff = useCallback(async (email: string, password: string) => {
    const res = await loginStaff(email, password);
    const t = res.accesstoken;
    await SecureStore.setItemAsync(STAFF_TOKEN_KEY, t);
    setToken(t);
    try {
      const me = await fetchStaffMe(t);
      setStaff(me);
    } catch {
      /* useEffect on token will retry or clear */
    }
  }, []);

  const signOutStaff = useCallback(async () => {
    await SecureStore.deleteItemAsync(STAFF_TOKEN_KEY);
    setToken(null);
    setStaff(null);
  }, []);

  const refreshStaff = useCallback(async () => {
    if (!token) return;
    try {
      const me = await fetchStaffMe(token);
      setStaff(me);
    } catch {
      /* keep */
    }
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      staff,
      loading,
      signInStaff,
      signOutStaff,
      refreshStaff,
    }),
    [token, staff, loading, signInStaff, signOutStaff, refreshStaff]
  );

  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>;
}

export function useStaffAuth() {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) throw new Error("useStaffAuth must be used within StaffAuthProvider");
  return ctx;
}
