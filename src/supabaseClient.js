import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://yxbcojnrmwxvcccezteo.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_eKZgFVZt5a95rc-DgvpXqg_dpGZJKT1';

export const getSupabaseConfig = () => {
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('flusso_supabase_url') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('flusso_supabase_anon_key') : null;

  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const url = (localUrl && localUrl.trim()) || (envUrl && envUrl.trim()) || DEFAULT_SUPABASE_URL;
  const anonKey = (localKey && localKey.trim()) || (envKey && envKey.trim()) || DEFAULT_SUPABASE_ANON_KEY;

  return { url, anonKey };
};

const { url, anonKey } = getSupabaseConfig();

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'flusso_permanent_auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
});

export const saveSupabaseCredentials = (customUrl, customKey) => {
  if (customUrl) localStorage.setItem('flusso_supabase_url', customUrl.trim());
  else localStorage.removeItem('flusso_supabase_url');

  if (customKey) localStorage.setItem('flusso_supabase_anon_key', customKey.trim());
  else localStorage.removeItem('flusso_supabase_anon_key');
};

export const getSavedSupabaseCredentials = () => {
  return getSupabaseConfig();
};
