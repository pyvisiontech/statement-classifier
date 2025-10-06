'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { validateEmail } from '@/lib/utils';
import { useGlobalContext } from '@/contexts/GlobalContext';
import { useAddClient, useEditClient } from '@/hooks/client';
import type { ClientData, ClientInsertData } from '@/types/supabaseHelperTypes';

const Schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().optional(),
  email: z
    .string()
    .min(1, { message: 'Please enter a valid email' })
    .refine((e) => validateEmail(e)),
  phone_number: z.string().min(1, 'Phone number is required'),
});

type FormValues = z.infer<typeof Schema>;

export default function AddClientDialog({
  onCreated,
  existingClientData,
  triggerLabel,
}: {
  onCreated?: () => void;
  existingClientData?: ClientData;
  /** optional custom label for the button that opens the dialog */
  triggerLabel?: string;
}) {
  const { user } = useGlobalContext();
  const [open, setOpen] = useState(false);

  const isEditing = Boolean(existingClientData?.id);
  const title = isEditing ? 'Edit client' : 'Add client';
  const submitLabel = isEditing ? 'Save changes' : 'Add client';
  const openerLabel = useMemo(
    () => triggerLabel ?? (isEditing ? 'Edit' : 'Add client'),
    [triggerLabel, isEditing]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
    },
    mode: 'onTouched',
  });

  // Pre-populate when editing (when dialog opens or existingClientData changes)
  useEffect(() => {
    if (isEditing && existingClientData) {
      form.reset({
        first_name: existingClientData.first_name ?? '',
        last_name: existingClientData.last_name ?? '',
        email: existingClientData.email ?? '',
        phone_number: existingClientData.phone_number ?? '',
      });
    } else if (!isEditing && open === false) {
      // ensure clean slate between separate opens for "add"
      form.reset({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, existingClientData, open]);

  // Create
  const { mutateAsync: createAsync, isPending: isCreating } = useAddClient({
    onSuccess: () => {
      setOpen(false);
      form.reset();
      toast.success('Client added successfully!');
      onCreated?.();
    },
    onError: () => {
      toast.error('Failed to add client');
    },
  });

  // Edit
  const { mutateAsync: editAsync, isPending: isEditingPending } = useEditClient(
    {
      onSuccess: () => {
        setOpen(false);
        toast.success('Client updated successfully!');
        onCreated?.();
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        toast.error(`Failed to update client${message ? `: ${message}` : ''}`);
      },
    }
  );

  async function onSubmit(values: FormValues) {
    if (isEditing && existingClientData?.id) {
      const payload: Partial<ClientInsertData> = {
        id: existingClientData.id,
        first_name: values.first_name,
        last_name: values.last_name || null,
        email: values.email,
        phone_number: values.phone_number,
      };
      await editAsync(payload);
      return;
    }

    // create
    const payload: ClientInsertData = {
      accountant_id: user?.id as string,
      first_name: values.first_name,
      last_name: values.last_name || null,
      email: values.email || '',
      phone_number: values.phone_number,
    };
    await createAsync(payload);
  }

  const submitting = isCreating || isEditingPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{openerLabel}</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="jane@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 555 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? (isEditing ? 'Saving…' : 'Adding…') : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
