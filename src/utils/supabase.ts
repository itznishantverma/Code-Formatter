import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ParsedProject {
  id?: string;
  name: string;
  files_data: Array<{
    path: string;
    content: string;
    operation: 'Read' | 'Write' | 'Edit';
    status?: 'success' | 'error';
    lineCount: number;
    toolCallId?: string;
  }>;
  created_at?: string;
  updated_at?: string;
}
