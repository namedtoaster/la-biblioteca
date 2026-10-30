'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Values come from the environment, never from the repo. Without them the app runs
// with no accounts and keeps everything in the browser.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;

export function accountsEnabled(): boolean {
  return Boolean(url && key);
}

export function supabase(): SupabaseClient | null {
  if (!url || !key) return null;
  client ??= createBrowserClient(url, key);
  return client;
}

export async function sendSignInLink(email: string): Promise<string | null> {
  const sb = supabase();
  if (!sb) return 'Accounts are not set up on this copy of the app.';
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
  if (!error) return null;
  if (/fetch|network/i.test(error.message)) return "Couldn't reach the sign-in service. Check your connection and try again.";
  return error.message;
}
