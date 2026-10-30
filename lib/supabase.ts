'use client';

import { createClient, type EmailOtpType, type SupabaseClient } from '@supabase/supabase-js';

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
  // Implicit flow: the email link returns the session itself, so it works when opened
  // from an email app, with Supabase's default email template and no saved verifier.
  client ??= createClient(url, key, {
    auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true },
  });
  return client;
}

export async function sendSignInLink(email: string): Promise<string | null> {
  const sb = supabase();
  if (!sb) return 'Accounts are not set up on this copy of the app.';
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
  return error ? friendly(error.message) : null;
}

function friendly(message: string): string {
  if (/fetch|network/i.test(message)) return "Couldn't reach the sign-in service. Check your connection and try again.";
  if (/expired|invalid/i.test(message)) return 'That code or link has expired or was already used. Send a new one.';
  return message;
}

/** Sign in with the code from the email. Works in any browser or app. */
export async function verifyCode(email: string, code: string): Promise<string | null> {
  const sb = supabase();
  if (!sb) return 'Accounts are not set up on this copy of the app.';
  const { error } = await sb.auth.verifyOtp({ email, token: code, type: 'email' });
  return error ? friendly(error.message) : null;
}

/** Sign in from an email link that carries its own token, so nothing has to be saved beforehand. */
export async function verifyLink(tokenHash: string, type: EmailOtpType): Promise<string | null> {
  const sb = supabase();
  if (!sb) return 'Accounts are not set up on this copy of the app.';
  const { error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type });
  return error ? friendly(error.message) : null;
}
