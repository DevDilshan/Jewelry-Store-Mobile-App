import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchCustomerMe, loginCustomer, registerCustomer } from "../api/jewelryApi";
import type { AuthUser } from "../types/models";

const TOKEN_KEY = "jewelry_customer_token";

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    address?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapLoginPayload(j: {
  id: string;
  firstname?: string;
  lastname?: string;
  email: string;
  address?: string;
}): AuthUser {
  return {
    id: String(j.id),
    firstName: j.firstname ?? "",
    lastName: j.lastname ?? "",
    email: j.email,
    address: j.address,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (cancelled) return;
        if (stored) {
          setToken(stored);
        }
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
      setUser(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchCustomerMe(token);
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) {
          setToken(null);
          setUser(null);
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await loginCustomer(email, password);
    const t = res.token;
    await SecureStore.setItemAsync(TOKEN_KEY, t);
    setToken(t);
    setUser(mapLoginPayload(res));
  }, []);

  const signUp = useCallback(
    async (params: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      address?: string;
    }) => {
      const res = await registerCustomer(params);
      const t = res.token;
      await SecureStore.setItemAsync(TOKEN_KEY, t);
      setToken(t);
      setUser(mapLoginPayload(res));
    },
    []
  );

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const me = await fetchCustomerMe(token);
      setUser(me);
    } catch {
      /* keep existing user */
    }
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [token, user, loading, signIn, signUp, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
