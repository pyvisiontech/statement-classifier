/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useState } from 'react';
import {
  useGetTransactionsByFile,
  useGetCategories,
  useUpdateTransactionsCategories,
} from '@/hooks/client';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGlobalContext } from '@/contexts/GlobalContext';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import React from 'react';

type Props = {
  clientId: string;
  fileId: string;
  trigger: React.ReactNode;
};

type SortMode =
  | 'created_desc'
  | 'created_asc'
  | 'category_asc'
  | 'category_desc';

export default function TransactionsDialog({
  clientId,
  fileId,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('created_desc');
  const [edits, setEdits] = useState<Record<string, string | null>>({});

  const {
    data: categories,
    isLoading: catsLoading,
    error: catsError,
  } = useGetCategories();

  const { user } = useGlobalContext();

  console.log(categories, 'categories');

  const {
    data: txns,
    isLoading: txnsLoading,
    error: txnsError,
  } = useGetTransactionsByFile(clientId, fileId);

  const { mutateAsync: saveChanges, isPending } =
    useUpdateTransactionsCategories(clientId, fileId);

  const onOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) setEdits({});
  };

  // Resolve display name: updated if present else AI
  const withDisplay = useMemo(() => {
    return (txns ?? []).map((t) => {
      const displayCategoryName =
        t.updated_category_name || t.ai_category_name || '';
      const displayCategoryId =
        t.updated_category_id || t.category_id_by_ai || null;
      const currentEditId = edits[t.id] ?? displayCategoryId;
      const currentEditName =
        categories?.find((c) => c.id === currentEditId)?.name ??
        (currentEditId === null ? '' : displayCategoryName);
      return {
        ...t,
        displayCategoryName,
        displayCategoryId,
        currentEditId,
        currentEditName,
      };
    });
  }, [txns, edits, categories]);

  // Sort options
  const sorted = useMemo(() => {
    const arr = [...withDisplay];
    switch (sortMode) {
      case 'created_asc':
        arr.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case 'category_asc':
        arr.sort((a, b) =>
          (a.currentEditName || '').localeCompare(b.currentEditName || '')
        );
        break;
      case 'category_desc':
        arr.sort((a, b) =>
          (b.currentEditName || '').localeCompare(a.currentEditName || '')
        );
        break;
      case 'created_desc':
      default:
        arr.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
    return arr;
  }, [withDisplay, sortMode]);

  const onChangeCategory = (txnId: string, newId: string | null) => {
    setEdits((prev) => ({ ...prev, [txnId]: newId }));
  };

  const onSave = async () => {
    const patches = sorted
      .filter(
        (t) => edits.hasOwnProperty(t.id) && edits[t.id] !== t.displayCategoryId
      )
      .map((t) => ({
        id: t.id,
        updated_category_id: Number(edits[t.id]) ?? null,
        accountant_id: user?.id as string,
      }));

    if (patches.length === 0) {
      toast.info('No changes to update');
      return;
    }
    try {
      await saveChanges(patches);
      toast.success('Transactions updated');
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to update transactions');
    }
  };

  const loading = txnsLoading || catsLoading;
  const hasError = txnsError || catsError;
  const isEmpty = !loading && !hasError && (sorted?.length ?? 0) === 0;

  const exportToExcel = async (data: typeof sorted) => {
   // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Transactions');

  // Define columns
  worksheet.columns = [
    { header: 'Time', key: 'Time', width: 28 },
    { header: 'Narration', key: 'Narration', width: 50 },
    { header: 'Amount', key: 'Amount', width: 12 },
    { header: 'Category', key: 'Category', width: 18 },
    { header: 'Category Reason', key: 'CategoryReason', width: 25 },
  ];

  // Make the header row bold
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
  });

  // Add rows from your table data
  data.forEach((item) => {
    worksheet.addRow({
      Time: item.tx_timestamp?.toLocaleString() ?? '',
      Narration: item.tx_narration,
      Amount: item.tx_amount?.toFixed(2) ?? '',
      Category: item.displayCategoryName ?? '',
      CategoryReason: item.reason ?? '',
    });
  });

  // Write workbook to buffer then trigger download
  workbook.xlsx.writeBuffer().then((buffer: any) => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'transactions.xlsx');
  });
  }

  const groupedByCategory = sorted.reduce((groups, transaction) => {
      const category = transaction.displayCategoryId || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(transaction);
      return groups;
    }, {} as Record<string, typeof sorted>);

const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({});

    const toggleCategory = (categoryId: string) => {
      setExpandedCategories((prev) => ({
        ...prev,
        [categoryId]: !prev[categoryId],
      }));
    };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="!max-w-[95vw] !sm:max-w-[95vw] w-[95vw] max-h-[90vh] overflow-hidden p-6">
        <DialogHeader>
          <DialogTitle>Transactions</DialogTitle>
        </DialogHeader>

        {/* Header controls */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="truncate text-sm text-slate-600">
            File: <span className="font-medium">{fileId}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Sort</label>
            <Select
              value={sortMode}
              onValueChange={(v) => setSortMode(v as SortMode)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_desc">
                  Created (new → old)
                </SelectItem>
                <SelectItem value="created_asc">Created (old → new)</SelectItem>
                <SelectItem value="category_asc">Category (A → Z)</SelectItem>
                <SelectItem value="category_desc">Category (Z → A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => exportToExcel(sorted)}
          >
            Download Excel
          </Button>
        </div>

        {/* Content area: loading / error / empty / table */}
        <div className="h-[65vh] w-full overflow-auto rounded-md border">
          <div className="min-w-[900px]">
            {loading ? (
              <div className="space-y-2 p-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-1/2" />
              </div>
            ) : hasError ? (
              <div className="p-6 text-sm text-red-600">
                {(txnsError as Error)?.message ||
                  (catsError as Error)?.message ||
                  'Something went wrong.'}
              </div>
            ) : isEmpty ? (
              <div className="flex h-[40vh] items-center justify-center p-6 text-center">
                <div>
                  <div className="text-base font-medium">
                    No transactions yet
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    When this file is processed, transactions will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[220px]">Time</TableHead>
                    <TableHead className="w-[220px]">Narration</TableHead>
                    <TableHead className="w-[220px]">Amount</TableHead>
                    <TableHead className="w-[260px]">Category (edit)</TableHead>
                    <TableHead className="w-[220px]">Category Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedByCategory).map(([categoryId, transactions]) => {
                    const categoryName = categories?.find(c => c.id.toString() === categoryId)?.name ?? 'Uncategorized';

                    const isExpanded = expandedCategories[categoryId];

                    return (
                      <React.Fragment key={categoryId}>
                        {/* Level 1: Category row */}
                        <TableRow
                          className="bg-gray-100 font-bold cursor-pointer"
                          onClick={() => toggleCategory(categoryId)}
                        >
                          <TableCell colSpan={5}>
                            {isExpanded ? '▼ ' : '▶ '} {categoryName}
                          </TableCell>
                        </TableRow>

                        {/* Level 2: Transactions under this category */}
                        {isExpanded && transactions.map((t) => {
                          const currentValue = edits[t.id] ?? t.displayCategoryId;
                          return (
                            <TableRow key={t.id}>
                              <TableCell className="whitespace-nowrap text-sm">{t.tx_timestamp?.toLocaleString()}</TableCell>
                              <TableCell className="text-sm whitespace-normal break-words max-w-[220px]">{t.tx_narration}</TableCell>
                              <TableCell className="whitespace-nowrap">{t.tx_amount?.toFixed(2)}</TableCell>
                              <TableCell className="whitespace-nowrap">
                                <Select
                                  value={currentValue?.toString() ?? 'none'}
                                  onValueChange={(v) => onChangeCategory(t.id, v === 'none' ? null : v)}
                                >
                                  <SelectTrigger className="min-w-[220px]">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">— None —</SelectItem>
                                    {categories?.map((c) => (
                                      <SelectItem key={c.id} value={c.id.toString()}>
                                        {c.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm">{t.reason}</TableCell>
                            </TableRow>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Close
          </Button>
          <Button
            onClick={onSave}
            disabled={
              isPending || loading || !!hasError || (sorted?.length ?? 0) === 0
            }
          >
            {isPending ? 'Updating…' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
