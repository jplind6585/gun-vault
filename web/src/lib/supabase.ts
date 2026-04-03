import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://joturvmcygdmpnhfsslu.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ESC5Ir0q9yoOoEhC03Tjdg_QrVnW8DG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export { SUPABASE_URL };
