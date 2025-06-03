
"use client";
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Loader2 } from 'lucide-react';
import type { NotionDataItem, NotionLink, NotionPriority, NotionStatus } from '@/lib/notion-data';
import { fetchNotionData } from '@/lib/notion-data';
import { cn } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from './ui/button';


const DEFAULT_COLUMN_WIDTH = 150;
const MIN_COLUMN_WIDTH = 80;
const RESIZE_HANDLE_WIDTH = 8;

interface ColumnConfig {
  key: keyof NotionDataItem;
  title: string;
  defaultWidth?: number;
  minWidth?: number;
  isSortable?: boolean;
}

const initialColumnsConfig: ColumnConfig[] = [
  { key: 'Name', title: 'Name', defaultWidth: 200, isSortable: true },
  { key: 'Company', title: 'Company', defaultWidth: 180, isSortable: true },
  { key: 'Status', title: 'Status', defaultWidth: 120, isSortable: true },
  { key: 'Priority', title: 'Priority', defaultWidth: 100, isSortable: true },
  { key: 'EstimatedValue', title: 'Est. Value', defaultWidth: 150, isSortable: true },
  { key: 'AccountOwner', title: 'Account Owner', defaultWidth: 180, isSortable: true },
];

interface ColumnState extends ColumnConfig {
  width: number;
}

interface NotionTableProps {
  initialData: NotionDataItem[];
}

export function NotionTable({ initialData }: NotionTableProps) {
  const [data, setData] = useState<NotionDataItem[]>(initialData);
  const [columns, setColumns] = useState<ColumnState[]>(() =>
    initialColumnsConfig.map(col => ({
      ...col,
      width: col.defaultWidth || DEFAULT_COLUMN_WIDTH,
      minWidth: col.minWidth || MIN_COLUMN_WIDTH,
    }))
  );
  const [sortConfig, setSortConfig] = useState<{ key: keyof NotionDataItem; direction: 'ascending' | 'descending' } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [draggingColumn, setDraggingColumn] = useState<string | null>(null);
  const [resizingColumn, setResizingColumn] = useState<{ key: string; startX: number; startWidth: number } | null>(null);
  
  const isMobile = useIsMobile();
  const tableRef = useRef<HTMLTableElement>(null);
  const isMounted = useRef(false);

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

  const handleSort = (key: keyof NotionDataItem) => {
    if (isLoading) return;

    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleDragStart = (e: React.DragEvent<HTMLTableCellElement>, key: string) => {
    setDraggingColumn(key);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableCellElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLTableCellElement>, targetKey: string) => {
    e.preventDefault();
    if (!draggingColumn || draggingColumn === targetKey) return;

    const newColumns = [...columns];
    const draggedIndex = newColumns.findIndex(col => col.key === draggingColumn);
    const targetIndex = newColumns.findIndex(col => col.key === targetKey);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [draggedItem] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, draggedItem);

    setColumns(newColumns);
    setDraggingColumn(null);
  };

  const handleDragEnd = () => {
    setDraggingColumn(null);
  };

  const handleMouseDownResize = (e: React.MouseEvent<HTMLDivElement>, key: string) => {
    e.preventDefault();
    const columnToResize = columns.find(col => col.key === key);
    if (!columnToResize) return;
    setResizingColumn({
      key,
      startX: e.clientX,
      startWidth: columnToResize.width,
    });
  };

  const handleMouseMoveResize = useCallback((e: MouseEvent) => {
    if (!resizingColumn) return;
    const dx = e.clientX - resizingColumn.startX;
    const newWidth = Math.max(resizingColumn.startWidth + dx, MIN_COLUMN_WIDTH);
    
    setColumns(prev =>
      prev.map(col =>
        col.key === resizingColumn.key ? { ...col, width: newWidth } : col
      )
    );
  }, [resizingColumn]);

  const handleMouseUpResize = useCallback(() => {
    setResizingColumn(null);
  }, []);

  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleMouseMoveResize);
      document.addEventListener('mouseup', handleMouseUpResize);
    } else {
      document.removeEventListener('mousemove', handleMouseMoveResize);
      document.removeEventListener('mouseup', handleMouseUpResize);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMoveResize);
      document.removeEventListener('mouseup', handleMouseUpResize);
    };
  }, [resizingColumn, handleMouseMoveResize, handleMouseUpResize]);


  const renderCellContent = (item: NotionDataItem, columnKey: keyof NotionDataItem) => {
    const value = item[columnKey];
    
    if (columnKey === 'Status') {
      const status = value as NotionStatus;
      let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";
      if (status === 'Closed') badgeVariant = 'default'; 
      else if (status === 'Lead') badgeVariant = 'secondary'; 
      else if (status === 'Proposal') return <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:border-yellow-400 dark:text-yellow-400">{status}</Badge>;
      else if (status === 'Lost') badgeVariant = 'destructive'; 
      
      return <Badge variant={badgeVariant} className={status === 'Closed' ? 'bg-accent text-accent-foreground hover:bg-accent/80' : ''}>{status}</Badge>;
    }

    if (columnKey === 'Priority') {
      const priority = value as NotionPriority;
      if (priority === 'High') return <Badge variant="destructive">{priority}</Badge>;
      else if (priority === 'Medium') return <Badge variant="outline" className="border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-500">{priority}</Badge>;
      else if (priority === 'Low') return <Badge variant="secondary">{priority}</Badge>;
      return <Badge>{priority}</Badge>;
    }

    if (columnKey === 'EstimatedValue') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value as number);
    }

    if (typeof value === 'object' && value !== null && 'label' in value && 'url' in value) {
      const link = value as NotionLink;
      return (
        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-code">
          {link.label}
        </a>
      );
    }
    return <span className="font-code">{String(value)}</span>;
  };

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
    <div className={cn("rounded-lg border shadow-md bg-card", { "overflow-x-auto": isMobile })}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/50 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <Table ref={tableRef} className="min-w-full">
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                draggable={!isLoading}
                onDragStart={(e) => !isLoading && handleDragStart(e, column.key as string)}
                onDragOver={handleDragOver}
                onDrop={(e) => !isLoading && handleDrop(e, column.key as string)}
                onDragEnd={handleDragEnd}
                style={{ width: `${column.width}px`, minWidth: `${column.minWidth}px` }}
                className={cn(
                  "group relative p-0 select-none transition-all duration-150 ease-in-out",
                  "border-r last:border-r-0",
                  { "opacity-50 bg-muted": draggingColumn === column.key }
                )}
              >
                <div className="flex items-center h-full px-3 py-3">
                  <GripVertical className="h-4 w-4 mr-2 text-muted-foreground cursor-grab group-hover:text-foreground transition-colors" />
                  <span 
                    className={cn(
                      "flex-grow truncate", 
                      column.isSortable ? "cursor-pointer hover:text-primary" : "",
                      isLoading && column.isSortable ? "cursor-not-allowed opacity-70" : ""
                    )}
                    onClick={() => column.isSortable && !isLoading && handleSort(column.key)}
                  >
                    {column.title}
                  </span>
                  {column.isSortable && sortConfig && sortConfig.key === column.key && !isLoading && (
                    sortConfig.direction === 'ascending' ? 
                    <ArrowUp className="h-4 w-4 ml-2 text-primary" /> : 
                    <ArrowDown className="h-4 w-4 ml-2 text-primary" />
                  )}
                </div>
                <div
                  onMouseDown={(e) => !isLoading && handleMouseDownResize(e, column.key as string)}
                  className={cn(
                    "absolute top-0 right-0 h-full",
                    isLoading ? "cursor-not-allowed" : "cursor-col-resize",
                    "w-2 bg-transparent hover:bg-primary/20 transition-colors duration-100",
                    { "bg-primary/40": resizingColumn?.key === column.key }
                  )}
                  style={{ width: `${RESIZE_HANDLE_WIDTH}px`, transform: `translateX(${RESIZE_HANDLE_WIDTH / 2}px)` }}
                />
              </TableHead>
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
                  className="px-3 py-3 border-r last:border-r-0 truncate"
                >
                  {renderCellContent(item, column.key)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data.length === 0 && !isLoading && (
        <div className="p-4 text-center text-muted-foreground">No data available.</div>
      )}
    </div>
    </>
  );
}

