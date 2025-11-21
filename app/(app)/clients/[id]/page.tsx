'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import AddClientDialog from '@/components/clients/AddClientDialog';

import { useGetDetailsByClientId, useGetFilesByClientId } from '@/hooks/client';
import UploadFilesDialog from '@/components/files/UploadFilesDialog';
import TransactionsDialog from '@/components/files/TransactionsDialog';

export default function ClientDetailsPage() {
  const params = useParams();
  const clientId = params?.id as string | undefined;

  const {
    data: client,
    isLoading: clientLoading,
    error: clientError,
  } = useGetDetailsByClientId(clientId);

  const {
    data: files,
    isLoading: filesLoading,
    error: filesError,
    refetch: refetchFiles,
  } = useGetFilesByClientId(clientId);

  // Client details loading
  if (clientLoading) {
    return <Skeleton className="h-40 w-full" />
  }

  // Client not found / error
  if (!client) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Client not found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">

            {clientError?.message ??
              `We couldn't find details for this client.`}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Client details */}
      <Card className="bg-white">
        <CardHeader className="flex items-center justify-between"> 
          <CardTitle>Client details</CardTitle> 
          <AddClientDialog existingClientData={client} triggerLabel="Edit" />
        </CardHeader> 
        <CardContent className="space-y-2">
          {client.first_name ? (
            <div className="text-sm">Name: {client.first_name}</div>
          ) : null}
          {client.email ? (
            <div className="text-sm">Email: {client.email}</div>
          ) : null}
          {client.phone_number ? (
            <div className="text-sm">Phone: {client.phone_number}</div>
          ) : null}
        </CardContent>
      </Card>

      {/* Files section */}
      <Card className="bg-white">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Files</CardTitle>
          <div className="flex gap-2">
            <UploadFilesDialog
              triggerLabel="Upload new File"
              clientId={client.id}
            />
            <Button variant="outline" onClick={() => refetchFiles()}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filesLoading ? (
            <div className="grid gap-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filesError ? (
            <p className="text-sm text-red-600">
              {(filesError as Error).message}
            </p>
          ) : !files || files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-sm text-slate-600">
                No files for this client yet.
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between py-3"
                >
                  <TransactionsDialog
                    clientId={clientId!}
                    fileId={f.id}
                    trigger={
                      <button className="truncate font-medium underline underline-offset-4 hover:opacity-80">
                        {f.name ?? 'Untitled file'}
                      </button>
                    }
                  />
                  {f.s3_path ? (
                    <a
                      href={''}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline underline-offset-4"
                    >
                      Open
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
