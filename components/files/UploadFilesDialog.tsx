'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useSignedUpload } from '@/hooks/client';
import { useQueryClient } from '@tanstack/react-query';

type Props = {
  clientId: string;
  triggerLabel?: string;
};

export default function UploadFilesDialog({
  clientId,
  triggerLabel = 'Upload new File',
}: Props) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { uploadOne } = useSignedUpload();
  const queryClient = useQueryClient();

  const onFilesPicked = useCallback(
    (picked: FileList | null) => {
      if (!picked || picked.length === 0) return;
      const existing = new Map(
        files.map((f) => [`${f.name}-${f.size}-${f.lastModified}`, f])
      );
      Array.from(picked).forEach((f) => {
        const key = `${f.name}-${f.size}-${f.lastModified}`;
        if (!existing.has(key)) existing.set(key, f);
      });
      setFiles(Array.from(existing.values()));
    },
    [files]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      onFilesPicked(e.dataTransfer.files);
    },
    [onFilesPicked]
  );

  const onDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!dragActive) setDragActive(true);
    },
    [dragActive]
  );

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const removeAt = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  const clearAll = () => setFiles([]);

  const formatBytes = (n?: number | null) => {
    if (!n) return '';
    if (n < 1024) return `${n} B`;
    const kb = n / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        await uploadOne({ clientId, file });
      }

      toast.success('Files uploaded!');
      // Invalidate files list for this client
      await queryClient.invalidateQueries({
        queryKey: ['client-files', clientId],
      });
      setOpen(false);
      clearAll();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to upload files';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) clearAll();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">{triggerLabel}</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload files</DialogTitle>
        </DialogHeader>

        {/* Drop zone */}
        <div
          className={[
            'mt-2 flex h-40 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed px-4 text-center',
            dragActive
              ? 'border-slate-900 bg-slate-50'
              : 'border-slate-300 hover:bg-slate-50',
          ].join(' ')}
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          <div>
            <div className="text-sm font-medium">Drag & drop files here</div>
            <div className="mt-1 text-xs text-slate-500">
              or click to browse
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => onFilesPicked(e.target.files)}
          />
        </div>

        {/* Selected files list */}
        <div className="mt-4">
          <div className="text-sm font-medium">Selected files</div>
          {files.length === 0 ? (
            <div className="mt-2 text-xs text-slate-500">
              No files selected yet.
            </div>
          ) : (
            <ScrollArea className="mt-2 max-h-48 rounded-md border">
              <ul className="divide-y">
                {files.map((f, i) => (
                  <li
                    key={`${f.name}-${f.size}-${f.lastModified}`}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm">{f.name}</div>
                      <div className="text-xs text-slate-500">
                        {formatBytes(f.size)}
                      </div>
                    </div>
                    <button
                      className="rounded-md p-1 hover:bg-slate-100"
                      onClick={() => removeAt(i)}
                      aria-label={`Remove ${f.name}`}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <div className="flex w-full items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false);
                clearAll();
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
