"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { NotionDataItem, NotionPriority, NotionStatus } from '@/types/notion-table.type';

export const TableCellContent = ({ item, columnKey }: { item: NotionDataItem; columnKey: keyof NotionDataItem }) => {
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

  return <span className="font-code">{String(value)}</span>;
};