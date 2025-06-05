"use client";

import React from 'react';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ColumnState, NotionDataItem, RESIZE_HANDLE_WIDTH, ResizingColumn, SortConfig } from '@/types/notion-table.type';
import { CustomTooltip } from '../ui/custom-tooltip';


export const TableHeaderCell = ({
    column,
    sortConfig,
    isLoading,
    draggingColumn,
    onSort,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onResize,
    resizingColumn
  }: {
    column: ColumnState;
    sortConfig: SortConfig | null;
    isLoading: boolean;
    draggingColumn: string | null;
    resizingColumn: ResizingColumn | null;
    onSort: (key: keyof NotionDataItem) => void;
    onDragStart: (e: React.DragEvent<HTMLTableCellElement>, key: string) => void;
    onDragOver: (e: React.DragEvent<HTMLTableCellElement>) => void;
    onDrop: (e: React.DragEvent<HTMLTableCellElement>, key: string) => void;
    onDragEnd: () => void;
    onResize: (e: React.MouseEvent<HTMLDivElement>, key: string) => void;
  }) => (
    <TableHead
      draggable={!isLoading}
      onDragStart={(e) => !isLoading && onDragStart(e, column.key as string)}
      onDragOver={onDragOver}
      onDrop={(e) => !isLoading && onDrop(e, column.key as string)}
      onDragEnd={onDragEnd}
      style={{ width: `${column.width}px`, minWidth: `${column.minWidth}px` }}
      className={cn(
        "group relative p-0 select-none transition-all duration-150 ease-in-out",
        "border-r last:border-r-0",
        { "opacity-50 bg-muted": draggingColumn === column.key }
      )}
    >
      <div className="flex items-center h-full px-3 py-3">
        <GripVertical 
          role="button"
          tabIndex={0}
          className="h-4 w-4 mr-2 text-muted-foreground cursor-grab group-hover:text-foreground transition-colors" 
        />
        <CustomTooltip content={<p>Sort {column.title}</p>}>
          <button
            type="button"
            disabled={isLoading || !column.isSortable}
            className={cn(
              "flex-grow truncate text-left",
              column.isSortable ? "cursor-pointer hover:text-primary" : "",
              isLoading && column.isSortable ? "cursor-not-allowed opacity-70" : ""
            )}
            onClick={() => column.isSortable && !isLoading && onSort(column.key)}
          >
            {column.title}
          </button>
        </CustomTooltip>
        {column.isSortable && sortConfig?.key === column.key && !isLoading && (
          sortConfig.direction === "ascending" ? (
            <ArrowUp className="h-4 w-4 ml-2 text-primary" />
          ) : (
            <ArrowDown className="h-4 w-4 ml-2 text-primary" />
          )
        )}
      </div>
      <div
        role="separator"
        tabIndex={0}
        onMouseDown={(e) => !isLoading && onResize(e, column.key as string)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            !isLoading && onResize(e as unknown as React.MouseEvent<HTMLDivElement>, column.key as string);
          }
        }}
        className={cn(
        "absolute top-0 right-0 h-full",
        isLoading ? "cursor-not-allowed" : "cursor-col-resize",
        "w-2 bg-transparent hover:bg-primary/20 transition-colors duration-100",
        { "bg-primary/40": resizingColumn?.key === column.key }
        )}
        style={{ width: `${RESIZE_HANDLE_WIDTH}px`, transform: `translateX(${RESIZE_HANDLE_WIDTH / 2}px)` }}
      />
    </TableHead>
  );