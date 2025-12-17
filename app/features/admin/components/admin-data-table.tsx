"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AdminDataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
};

export function AdminDataTable<TData, TValue>({
  columns,
  data,
}: AdminDataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader className="bg-muted">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length
          ? table.getRowModel().rows.map((row) => (
              <TableRow
                data-state={row.getIsSelected() && "selected"}
                key={row.id}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          : null}
      </TableBody>
    </Table>
  );
}

type AdminDataTableSkeletonProps = {
  columnCount: number;
  rowCount?: number;
};

export function AdminDataTableSkeleton({
  columnCount,
  rowCount = 10,
}: AdminDataTableSkeletonProps) {
  const rowKeys = Array.from({ length: rowCount }, (_, i) => `row-${i}`);
  const colKeys = Array.from({ length: columnCount }, (_, i) => `col-${i}`);

  return (
    <Table>
      <TableHeader className="bg-muted">
        <TableRow>
          {colKeys.map((colKey) => (
            <TableHead className="" key={colKey}>
              <Skeleton className="h-4 w-20 bg-muted/50" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rowKeys.map((rowKey) => (
          <TableRow className="h-12" key={rowKey}>
            {colKeys.map((colKey) => (
              <TableCell key={`${rowKey}-${colKey}`}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
