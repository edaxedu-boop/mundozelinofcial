import { createClient } from '@insforge/sdk';

const baseUrl = import.meta.env.VITE_INSFORGE_URL || 'https://tzby93ke.us-east.insforge.app';
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY || 'ik_2e45b24f299f2a07114b2f41824cd8ee';

export const insforge = createClient({
  baseUrl,
  anonKey,
});
