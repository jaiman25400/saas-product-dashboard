"use client";

import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getFirebaseAuth } from "@/lib/firebase/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { USER_ERRORS } from "@/lib/errors/user-messages";
import type { Role } from "@/types/role";

type AuthContextValue = {
  user: User | null;
  role: Role | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<Role>;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function establishServerSession(idToken: string): Promise<void> {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(
      getAuthErrorMessage(
        new Error(data.error ?? USER_ERRORS.sessionFailed),
        USER_ERRORS.sessionFailed,
      ),
    );
  }
}

async function registerUserProfile(idToken: string): Promise<Role> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  const data = (await response.json()) as { role?: Role; error?: string };

  if (!response.ok) {
    throw new Error(
      getAuthErrorMessage(
        new Error(data.error ?? USER_ERRORS.registrationFailed),
        USER_ERRORS.registrationFailed,
      ),
    );
  }

  return data.role ?? "viewer";
}

function readRoleFromToken(user: User): Promise<Role | null> {
  return user.getIdTokenResult().then((result) => {
    const role = result.claims.role;
    return role === "admin" || role === "viewer" ? role : null;
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();

    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setRole(null);
        setLoading(false);
        return;
      }

      const tokenRole = await readRoleFromToken(firebaseUser);
      setRole(tokenRole);
      setLoading(false);
    });
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const auth = getFirebaseAuth();
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      const idToken = await credential.user.getIdToken();
      const assignedRole = await registerUserProfile(idToken);

      // Force refresh so custom claims are available on the client token
      await credential.user.getIdToken(true);
      const refreshedRole = await readRoleFromToken(credential.user);

      await establishServerSession(await credential.user.getIdToken());
      setRole(refreshedRole ?? assignedRole);

      return assignedRole;
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, USER_ERRORS.signUpFailed));
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const tokenRole = await readRoleFromToken(credential.user);

      await establishServerSession(await credential.user.getIdToken());
      setRole(tokenRole);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, USER_ERRORS.signInFailed));
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await signOut(getFirebaseAuth());
    setRole(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      signUp,
      signIn,
      signOutUser,
    }),
    [user, role, loading, signUp, signIn, signOutUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
