import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { pullFromSupabase, pushLocalDataToSupabase } from '../lib/sync';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (event === 'SIGNED_IN' && nextUser) {
        // Try to pull existing data from Supabase first
        const hadData = await pullFromSupabase();
        if (!hadData) {
          // New user — push whatever is in localStorage (seed data or prior data)
          await pushLocalDataToSupabase();
        }
      }

      if (event === 'SIGNED_OUT') {
        // Clear local data on sign out so next user starts fresh
        const keysToKeep = ['gunvault_claude_key', 'lindcott_settings'];
        const saved: Record<string, string> = {};
        keysToKeep.forEach(k => { const v = localStorage.getItem(k); if (v) saved[k] = v; });
        localStorage.clear();
        keysToKeep.forEach(k => { if (saved[k]) localStorage.setItem(k, saved[k]); });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
