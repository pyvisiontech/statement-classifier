/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useState } from 'react';
import {
  useGetTransactionsByFile,
  useGetCategories,
  useUpdateTransactionsCategories,
  useAddCategory,
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
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

type Props = {
  clientId: string;
  fileId: string;
  trigger: React.ReactNode;
};

type CategoryGroup = { name: string; value: number; percentage: number };

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const CHART_COLORS = [
  '#FF6B6B',
  '#F7B801',
  '#845EC2',
  '#2C73D2',
  '#00C9A7',
  '#FF9671',
  '#008F7A',
  '#C34A36',
  '#4D8076',
];

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
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const addCategoryMutation = useAddCategory();

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

  const categorySummary = useMemo(() => {
    if (!sorted?.length) {
      return { total: 0, groups: [] as CategoryGroup[] };
    }

    let total = 0;
    const map = new Map<string, number>();
    sorted.forEach((txn) => {
      const amount = Math.abs(Number(txn.tx_amount) || 0);
      if (!amount) return;
      total += amount;
      const key = txn.currentEditName || 'Uncategorized';
      map.set(key, (map.get(key) || 0) + amount);
    });

    const groups = Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
      percentage: total ? (value / total) * 100 : 0,
    }));

    return { total, groups };
  }, [sorted]);

  const hasChartData = categorySummary.groups.length > 0;

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


const addCategory = async (name: string, txnId: string) => {
  setIsAddingCategory(true);
  try {
    const result = await addCategoryMutation.mutateAsync({ name });
    // Optionally patch local categories, but best to refetch automatically
    setEdits((e) => ({
      ...e,
      [txnId]: result.id.toString(),
    }));
    setShowAddCategory(null);
    setNewCategoryName('');
  } catch (e) {
    toast.error('Unable to add category');
  }
  setIsAddingCategory(false);
};

  const [showAddCategory, setShowAddCategory] = useState<string | null>(null); // txnId if adding
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="!max-w-[95vw] !sm:max-w-[95vw] w-[95vw] max-h-[90vh] overflow-hidden p-6">
        <DialogHeader>
          <DialogTitle>Transactions</DialogTitle>
        </DialogHeader>

        {/* Header controls */}
        <div className="mb-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="truncate text-sm text-slate-600">
              File: <span className="font-medium">{fileId}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">View</span>
              <div className="flex overflow-hidden rounded-lg border">
                {(['table', 'chart'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={`cursor-pointer px-3 py-1 text-sm font-medium transition-colors ${
                      viewMode === mode
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {mode === 'table' ? 'Table view' : 'Graph view'}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={() => exportToExcel(sorted)} className="cursor-pointer">
              Download Excel
            </Button>
          </div>
          {viewMode === 'table' ? (
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
                  <SelectItem value="created_asc">
                    Created (old → new)
                  </SelectItem>
                  <SelectItem value="category_asc">Category (A → Z)</SelectItem>
                  <SelectItem value="category_desc">
                    Category (Z → A)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

         {/* Content area  */}
        {viewMode === 'table' ? (
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
                      When this file is processed, transactions will appear
                      here.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  {showAddCategory && (
  <Dialog open={true} onOpenChange={() => setShowAddCategory(null)}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Category</DialogTitle>
      </DialogHeader>
      <input
        value={newCategoryName}
        onChange={(e) => setNewCategoryName(e.target.value)}
        className="border rounded p-2 w-full"
        placeholder="Enter new category name"
        autoFocus
        disabled={isAddingCategory}
      />
      <DialogFooter>
        <Button variant="ghost" onClick={() => setShowAddCategory(null)} disabled={isAddingCategory}>
          Cancel
        </Button>
        <Button
          onClick={() => addCategory(newCategoryName, showAddCategory!)}
          disabled={!newCategoryName.trim() || isAddingCategory}
        >
          Add
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}
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
                                  onValueChange={(v) => {
                                    if (v === '__add__') {
                                      setShowAddCategory(t.id); // t.id == current transaction id
                                    } else {
                                      onChangeCategory(t.id, v === 'none' ? null : v);
                                    }
                                  }}
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
                                    <SelectItem value="__add__" className="text-blue-600 font-semibold">
                                      + Add Category
                                    </SelectItem>
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
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-[65vh] w-full rounded-md border p-4">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Preparing chart…
              </div>
            ) : hasError ? (
              <div className="p-6 text-center text-sm text-red-600">
                {(txnsError as Error)?.message ||
                  (catsError as Error)?.message ||
                  'Something went wrong.'}
              </div>
            ) : !hasChartData ? (
              <div className="flex h-full items-center justify-center rounded-md border border-dashed p-6 text-center text-sm text-slate-500">
                Not enough categorized transactions to render a chart yet.
              </div>
            ) : (
              <div className="flex h-full flex-col gap-4 lg:flex-row">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categorySummary.groups}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={80}
                        outerRadius={140}
                        paddingAngle={2}
                      >
                        {categorySummary.groups.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name) => [
                          currencyFormatter.format(Number(value)),
                          name,
                        ]}
                      />
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-slate-700 text-sm font-semibold"
                      >
                        Transactions
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 rounded-md border p-3 lg:w-64">
                  <p className="text-sm font-semibold text-slate-600">
                    Transaction categories
                  </p>
                  {categorySummary.groups.map((group, idx) => (
                    <div
                      key={group.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              CHART_COLORS[idx % CHART_COLORS.length],
                          }}
                        />
                        <span>{group.name}</span>
                      </div>
                      <span className="font-medium">
                        {currencyFormatter.format(group.value)} (
                        {group.percentage.toFixed(2)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isPending}
            className="cursor-pointer"
          >
            Close
          </Button>
          <Button
            onClick={onSave}
            disabled={
              isPending || loading || !!hasError || (sorted?.length ?? 0) === 0
            }
            className="cursor-pointer"
          >
            {isPending ? 'Updating…' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
