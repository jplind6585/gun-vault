import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

const SUPABASE_URL = 'https://joturvmcygdmpnhfsslu.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ESC5Ir0q9yoOoEhC03Tjdg_QrVnW8DG';

// On native (Android/iOS), use implicit flow so that OAuth tokens arrive directly
// in the deep link URL fragment. PKCE requires a code verifier in localStorage,
// which is lost when Android kills the background WebView on deep link launch.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    flowType: Capacitor.isNativePlatform() ? 'implicit' : 'pkce',
  },
});

export { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY };
