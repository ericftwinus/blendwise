"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import { auth } from "./client";

interface AuthClaims {
  role?: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  claims: AuthClaims;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  claims: {},
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<AuthClaims>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const tokenResult = await firebaseUser.getIdTokenResult();
        setClaims((tokenResult.claims as AuthClaims) || {});
      } else {
        setClaims({});
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function signOut() {
    await fetch("/api/auth/session", { method: "DELETE" });
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, claims, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
