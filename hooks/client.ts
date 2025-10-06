'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/contexts/SupabaseContext';
import {
  CategoryData,
  ClientData,
  ClientInsertData,
  FileData,
  TransactionData,
} from '@/types/supabaseHelperTypes';
import { useCallback } from 'react';
import { useGlobalContext } from '@/contexts/GlobalContext';

export function useGetClients() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('first_name', { ascending: true });
      if (error) throw new Error(error.message);
      return (data as ClientData[]) ?? [];
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useGetDetailsByClientId(clientId?: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['client-details', clientId],
    enabled: Boolean(clientId && supabase), // only run if clientId exists
    queryFn: async () => {
      if (!clientId) throw new Error('Missing clientId');

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw new Error(error.message);
      return data as ClientData;
    },
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
    retry: 1, // retry once on failure
  });
}

export function useAddClient(opts?: {
  onSuccess?: () => void;
  onError?: (e: unknown) => void;
}) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['add-client'],
    mutationFn: async (values: ClientInsertData) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(values)
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      opts?.onSuccess?.();
    },
    onError: (e) => {
      opts?.onError?.(e);
    },
  });
}

export function useEditClient(opts?: {
  onSuccess?: () => void;
  onError?: (e: unknown) => void;
}) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['edit-client'],
    mutationFn: async (values: Partial<ClientInsertData>) => {
      const { id, ...updates } = values;
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id as string)
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: async (_data, vars) => {
      // refresh lists and the details cache for this client
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      await queryClient.invalidateQueries({
        queryKey: ['client-details', vars.id],
      });
      opts?.onSuccess?.();
    },
    onError: (e) => opts?.onError?.(e),
  });
}

export function useGetFilesByClientId(clientId?: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['client-files', clientId],
    enabled: Boolean(clientId && supabase),
    queryFn: async () => {
      if (!clientId) throw new Error('Missing clientId');

      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('client_id', clientId)
        .order('uploaded_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as FileData[];
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

type GetSignedUploadArgs = {
  clientId: string;
  file: File;
};

type SignedUploadResponse = {
  bucket: string;
  path: string;
  token: string;
};

export function useSignedUpload() {
  const supabase = useSupabase();
  const { user } = useGlobalContext();

  const uploadOne = useCallback(
    async ({ clientId, file }: GetSignedUploadArgs) => {
      // Step 1: get signed upload URL from your API
      const res = await fetch('/api/storage/signed-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Failed to get signed upload URL');
      }

      const { bucket, path, token } =
        (await res.json()) as SignedUploadResponse;

      // Step 2: Upload file to Supabase storage (private bucket)
      const { data: uploadedFileData, error: uploadedFileError } =
        await supabase.storage
          .from(bucket)
          .uploadToSignedUrl(path, token, file, {
            contentType: file.type,
            upsert: true,
          });

      console.log(uploadedFileError, 'uploadedFileError');

      if (uploadedFileError) throw new Error(uploadedFileError.message);

      // Step 3: Insert record in `files` table
      const { data, error } = await supabase
        .from('files')
        .insert({
          s3_path: uploadedFileData.path ?? '',
          accountant_id: user?.id as string,
          client_id: clientId,
          file_size: file.size,
          name: file.name,
        })
        .select('id');

      if (error) throw new Error(error.message);

      const fileId = data?.[0].id;

      const objectPath = uploadedFileData.path;

      const signedDownloadRes = await fetch('/api/storage/sign-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: objectPath, expiresIn: 300 }),
      });

      const { signedUrl } = await signedDownloadRes.json();

      // Step 5: Notify backend about the new file
      await fetch('https://python-render-hello.onrender.com/classifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          signed_url: signedUrl,
          file_id: fileId,
          accountant_id: user?.id as string,
        }),
      })
        .then((res) => {
          console.log(res, 'API res');
        })
        .catch((err) => {
          console.error('Failed to notify backend:', err);
        });

      return { bucket, path, file };
    },
    [supabase, user?.id]
  );

  return { uploadOne };
}

export function useGetCategories() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as CategoryData[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export type Txn = TransactionData & {
  ai_category_name?: string | null;
  updated_category_name?: string | null;
};

export function useGetTransactionsByFile(clientId?: string, fileId?: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['transactions-by-file', clientId, fileId],
    enabled: Boolean(clientId && fileId),
    queryFn: async () => {
      if (!clientId || !fileId) return [] as Txn[];

      const { data, error } = await supabase
        .from('transactions')
        .select(
          `
          *,
          ai:categories!transactions_category_id_by_ai_fkey ( name ),
          updated:categories!transactions_updated_category_id_fkey ( name )
        `
        )
        .eq('client_id', clientId)
        .eq('file_id', fileId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      return (data ?? []).map((row: any) => ({
        id: row.id,
        client_id: row.client_id,
        file_id: row.file_id,
        reason: row.reason,
        category_id_by_ai: row.category_id_by_ai,
        updated_category_id: row.updated_category_id,
        created_at: row.created_at,
        ai_category_name: row.ai?.[0]?.name ?? row.ai?.name ?? null,
        updated_category_name:
          row.updated?.[0]?.name ?? row.updated?.name ?? null,
      })) as Txn[];
    },
    staleTime: 1000 * 30,
  });
}

export type TxnCategoryPatch = {
  id: string;
  accountant_id: string;
  updated_category_id: string | null;
};

export function useUpdateTransactionsCategories(
  clientId: string,
  fileId: string
) {
  const supabase = useSupabase();
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ['update-txns-categories', clientId, fileId],
    mutationFn: async (patches: TxnCategoryPatch[]) => {
      if (!patches?.length) return [];

      const results: { id: string }[] = [];
      const errors: string[] = [];

      // Update each row individually so each can have a distinct value
      for (const p of patches) {
        const { data, error } = await supabase
          .from('transactions')
          .update({ updated_category_id: p.updated_category_id })
          .eq('id', p.id)
          .eq('client_id', clientId) // extra safety (and RLS friendliness)
          .eq('file_id', fileId)
          .select('id')
          .single();

        if (error) {
          errors.push(`tx ${p.id}: ${error.message}`);
        } else if (data) {
          results.push(data);
        }
      }

      if (errors.length) {
        // Surface all failures at once
        throw new Error(
          `Failed to update some transactions:\n- ${errors.join('\n- ')}`
        );
      }

      return results;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ['transactions-by-file', clientId, fileId],
      });
    },
  });
}
