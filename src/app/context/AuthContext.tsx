/**
 * AuthContext — powered by Appwrite Web SDK
 *
 * Provides:
 *   - isAuthenticated / user / loading
 *   - signIn, signUp, signOut
 *   - sendVerification, completeVerification
 *
 * No API keys or tokens are stored in localStorage.
 * Appwrite manages the session via a secure cookie automatically.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import {
  createAccount,
  signIn as authSignIn,
  signOut as authSignOut,
  getCurrentUser,
  sendVerificationEmail,
  completeVerification as authCompleteVerification,
  createUserProfile,
  type AppwriteUser,
} from '../lib/auth.service';

// ── Types ──────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  avatarInitial: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  /** True while we're restoring the session on mount */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Resend the email verification link */
  sendVerification: () => Promise<void>;
  /** Complete email verification (called from the /verify-email page) */
  completeVerification: (userId: string, secret: string) => Promise<void>;
  /** Refresh user data from Appwrite */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Helper ─────────────────────────────────────────────────────────

function mapUser(u: AppwriteUser): User {
  return {
    id: u.$id,
    name: u.name,
    email: u.email,
    emailVerified: u.emailVerification,
    avatarInitial: u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase(),
  };
}

// ── Provider ───────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  // Restore session on mount — only treat VERIFIED users as authenticated
  useEffect(() => {
    getCurrentUser()
      .then((u) => { if (u && u.emailVerification) setUser(mapUser(u)); })
      .catch(() => { /* no session */ })
      .finally(() => setLoading(false));
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await getCurrentUser();
    setUser(u ? mapUser(u) : null);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await authSignIn(email, password);
    const u = await getCurrentUser();
    if (u) setUser(mapUser(u));
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    await createAccount({ email, password, fullName });
    // User is NOT signed in after signup — they must verify email first
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    setUser(null);
  }, []);

  const sendVerification = useCallback(async () => {
    await sendVerificationEmail();
  }, []);

  const completeVerification = useCallback(async (userId: string, secret: string) => {
    await authCompleteVerification(userId, secret);
    // Create profile now that the user is verified
    const u = await getCurrentUser();
    if (u && u.emailVerification) {
      await createUserProfile(u.$id, u.name, u.email);
    }
    // Refresh user to pick up emailVerification = true
    await refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        signIn,
        signUp,
        signOut,
        sendVerification,
        completeVerification,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
