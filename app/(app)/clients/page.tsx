'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetClients } from '@/hooks/client';
import AddClientDialog from '@/components/clients/AddClientDialog';

export default function ClientsPage() {
  const { data, isLoading, error, refetch } = useGetClients();

  if (isLoading) {
    return (
      <div className="grid gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Clients</CardTitle>
          <AddClientDialog onCreated={refetch} />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-white">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Clients</CardTitle>
          <AddClientDialog onCreated={refetch} />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-lg font-medium">No clients yet</div>
            <p className="mt-1 text-sm text-slate-500">
              Once you add clients, they will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clients</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
          <AddClientDialog onCreated={refetch} />
        </div>
      </div>

      <div className="grid gap-3">
        {data.map((c) => (
          <Link
            key={c.id}
            href={`/clients/${c.id}`}
            className="rounded-xl border bg-white p-4 hover:bg-slate-50"
          >
            <div className="font-medium">{c.first_name}</div>
            {c.email ? (
              <div className="text-sm text-slate-500">{c.email}</div>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
