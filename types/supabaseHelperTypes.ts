import type { Database } from '@/types/supabase';

// Tables
export type AccountantData = Database['public']['Tables']['accountants']['Row'];
export type ClientData = Database['public']['Tables']['clients']['Row'];
export type TransactionData =
  Database['public']['Tables']['transactions']['Row'];
export type FileData = Database['public']['Tables']['files']['Row'];
export type CategoryData = Database['public']['Tables']['categories']['Row'];

// Insert types
export type AccountantInsertRow =
  Database['public']['Tables']['accountants']['Insert'];
export type ClientInsertData =
  Database['public']['Tables']['clients']['Insert'];
export type TransactionInsertData =
  Database['public']['Tables']['transactions']['Insert'];
export type FileInsertData = Database['public']['Tables']['files']['Insert'];
export type CategoryInsertData =
  Database['public']['Tables']['categories']['Insert'];
