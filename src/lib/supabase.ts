import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function extractFunctionErrorReason(error: unknown, fallback = 'network_error'): Promise<string> {
  try {
    const fnErr = error as { context?: { json: () => Promise<Record<string, unknown>> } };
    if (fnErr.context?.json) {
      const body = await fnErr.context.json();
      return (body?.reason as string) ?? fallback;
    }
  } catch { /* ignore */ }
  return fallback;
}
