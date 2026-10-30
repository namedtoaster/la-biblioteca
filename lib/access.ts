'use client';

import { readSettings } from './store';
import { accountsEnabled, supabase } from './supabase';

/**
 * Whether this visitor may use the app. With accounts set up, that means signed in:
 * recording needs an account. A copy run without accounts (local development) only needs
 * onboarding finished, and keeps everything in the browser.
 */
export async function canUseApp(): Promise<boolean> {
  if (!accountsEnabled()) return readSettings().onboarded;
  const { data } = await supabase()!.auth.getSession();
  return Boolean(data.session);
}
