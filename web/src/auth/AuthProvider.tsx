import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { pullFromSupabase, pushLocalDataToSupabase } from '../lib/sync';
import { clearDemoData } from '../storage';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAnonymous: false,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isAnonymous = user?.is_anonymous ?? false;

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
          const isDemo = localStorage.getItem('gunvault_is_demo') === 'true';
          if (isDemo) {
            // New user who only has seed/demo data — clear it, they start fresh
            clearDemoData();
          } else {
            // New user who entered their own data before signing in — push it up
            await pushLocalDataToSupabase();
          }
        }
      }

      if (event === 'SIGNED_OUT') {
        // Clear local data on sign out so next user starts fresh
        const keysToKeep = ['gunvault_claude_key', 'lindcott_settings', 'lindcott_initial_goals'];
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
    <AuthContext.Provider value={{ user, loading, isAnonymous, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
