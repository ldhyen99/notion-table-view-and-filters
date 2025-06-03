"use client";

import React, {  useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { useColumnResize } from '@/hooks/use-column-resize';
import { ColumnConfig, ColumnState, DEFAULT_COLUMN_WIDTH, MIN_COLUMN_WIDTH, NotionDataItem, SortConfig } from '@/types/notion-table.type';
import { cn } from '@/lib/utils';
import { fetchNotionData } from '@/server/notion-table.server';
import { useIsMobile } from '@/hooks/use-mobile';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { TableHeaderCell } from './table-header-cell';
import { TableCellContent } from './table-cell-content';

const initialColumnsConfig: ColumnConfig[] = [
  { key: 'Name', title: 'Name', defaultWidth: 200, isSortable: true },
  { key: 'Company', title: 'Company', defaultWidth: 180, isSortable: true },
  { key: 'Status', title: 'Status', defaultWidth: 120, isSortable: true },
  { key: 'Priority', title: 'Priority', defaultWidth: 100, isSortable: true },
  { key: 'EstimatedValue', title: 'Est. Value', defaultWidth: 150, isSortable: true },
  { key: 'AccountOwner', title: 'Account Owner', defaultWidth: 180, isSortable: true },
];

interface NotionTableProps {
  initialData: NotionDataItem[];
}

export function NotionTable({ initialData }: NotionTableProps) {
  const [data, setData] = useState<NotionDataItem[]>(initialData);
  const [columns, setColumns] = useState<ColumnState[]>(
    initialColumnsConfig.map((col) => ({
      ...col,
      width: col.defaultWidth || DEFAULT_COLUMN_WIDTH,
      minWidth: col.minWidth || MIN_COLUMN_WIDTH,
    }))
  );
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [draggingColumn, setDraggingColumn] = useState<string | null>(null);

  const { resizingColumn, handleMouseDownResize } = useColumnResize(columns, setColumns);

  const isMobile = useIsMobile();
  const tableRef = useRef<HTMLTableElement>(null);
  const isMounted = useRef(false);

  const handleSort = (key: keyof NotionDataItem) => {
    if (isLoading) return;
    const direction =
      sortConfig?.key === key && sortConfig.direction === "ascending" ? "descending" : "ascending";
    setSortConfig({ key, direction });
  };

  // Handle drag-and-drop
  const handleDragStart = (e: React.DragEvent<HTMLTableCellElement>, key: string) => {
    setDraggingColumn(key);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", key);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableCellElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLTableCellElement>, targetKey: string) => {
    e.preventDefault();
    if (!draggingColumn || draggingColumn === targetKey) return;

    const newColumns = [...columns];
    const draggedIndex = newColumns.findIndex((col) => col.key === draggingColumn);
    const targetIndex = newColumns.findIndex((col) => col.key === targetKey);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [draggedItem] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, draggedItem);

    setColumns(newColumns);
    setDraggingColumn(null);
  };

  const handleDragEnd = () => {
    setDraggingColumn(null);
  };

  useEffect(() => {
    if (!sortConfig) {
      setData(initialData);
    }
  }, [initialData, sortConfig]);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      if (!sortConfig) { 
        return;
      }
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const apiData = await fetchNotionData(sortConfig?.key, sortConfig?.direction);
        setData(apiData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [sortConfig]);

  return (
    <>
      {sortConfig && (
         <div className="mb-4 flex justify-end">
         <Button 
           onClick={() => setSortConfig(null)} 
           variant="outline" 
           size="sm"
           disabled={isLoading}
         >
           Reset Sort
         </Button>
       </div>
      )}
      <main className={cn("rounded-lg border shadow-md bg-card", { "overflow-x-auto": isMobile })}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/50 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <Table ref={tableRef} className="min-w-full">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHeaderCell
                  key={column.key}
                  column={column}
                  sortConfig={sortConfig}
                  isLoading={isLoading}
                  draggingColumn={draggingColumn}
                  onSort={handleSort}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  onResize={handleMouseDownResize}
                  resizingColumn={resizingColumn}
                />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/50 transition-colors duration-150">
                {columns.map((column) => (
                  <TableCell
                    key={`${item.id}-${column.key}`}
                    style={{ width: `${column.width}px` }}
                    className={cn(
                      "px-3 py-3 border-r last:border-r-0 truncate",
                      resizingColumn?.key === column.key && "bg-primary/10"
                    )}
                  >
                    <TableCellContent item={item} columnKey={column.key} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length === 0 && !isLoading && (
          <div className="p-4 text-center text-muted-foreground">No data available.</div>
        )}
      </main>
    </>
  );
}