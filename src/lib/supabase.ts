import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    //schema: 'andrewsdentalgroup',
  },
  auth: {
    persistSession: true,
    storage: localStorage
  },
  global: {
    headers: {
      // 'Accept-Profile': 'andrewsdentalgroup',
      // 'Content-Profile': 'andrewsdentalgroup'
    }
  }
});