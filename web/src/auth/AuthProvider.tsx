import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { pullFromSupabase, pushLocalDataToSupabase } from '../lib/sync';
import { clearDemoData } from '../storage';
import { Capacitor } from '@capacitor/core';

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
  // E2E test bypass: if a fake user id is injected into localStorage, skip Supabase auth
  const e2eUserId = typeof window !== 'undefined' && localStorage.getItem('gunvault_e2e_user');
  const e2eUser = e2eUserId ? { id: e2eUserId, is_anonymous: true } as unknown as User : null;

  const [user, setUser] = useState<User | null>(e2eUser);
  const [loading, setLoading] = useState(e2eUser ? false : true);
  const isAnonymous = user?.is_anonymous ?? false;

  useEffect(() => {
    // E2E mode — skip real auth
    if (e2eUser) return;

    // Safety net: never hang on authLoading for more than 5 seconds
    const authTimeout = setTimeout(() => setLoading(false), 5000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(authTimeout);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      clearTimeout(authTimeout);
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
        // gunvault_cartridges is shared reference data (encyclopedia), not user data — preserve it
        const keysToKeep = ['gunvault_claude_key', 'lindcott_settings', 'lindcott_initial_goals', 'gunvault_initialized', 'gunvault_version', 'gunvault_cartridges'];
        const saved: Record<string, string> = {};
        keysToKeep.forEach(k => { const v = localStorage.getItem(k); if (v) saved[k] = v; });
        localStorage.clear();
        keysToKeep.forEach(k => { if (saved[k]) localStorage.setItem(k, saved[k]); });
      }
    });

    // Handle OAuth deep link callback on native (e.g. after Google SSO)
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appUrlOpen', async ({ url }) => {
          console.log('[auth] appUrlOpen:', url);
          if (!url.startsWith('com.lindcottarmory.app://')) return;

          // Implicit flow: tokens arrive in the URL fragment
          const hash = url.includes('#') ? url.split('#')[1] : '';
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          console.log('[auth] implicit tokens found:', !!accessToken, !!refreshToken);
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            return;
          }

          // PKCE fallback: exchange authorization code for session
          const query = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
          const queryParams = new URLSearchParams(query);
          const code = queryParams.get('code');
          console.log('[auth] pkce code found:', !!code);
          if (code) {
            await supabase.auth.exchangeCodeForSession(url);
          }
        });
      });
    }

    return () => { clearTimeout(authTimeout); subscription.unsubscribe(); };
  }, []);

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch {
      // Server-side revocation failed — still clear locally and reload
    }
    window.location.reload();
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAnonymous, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
