export type NotionStatus = 'Closed' | 'Lead' | 'Proposal' | 'Lost' | 'Qualified' | 'Negotiation';
export type NotionPriority = 'High' | 'Medium' | 'Low';

export interface NotionDataItem {
  id: number;
  Name: string;
  Company: string;
  Status: NotionStatus;
  Priority: NotionPriority;
  EstimatedValue: number;
  AccountOwner: string;
  [key: string]: string | number | NotionStatus | NotionPriority;
}

export interface ApiDataTableItem {
  name: string;
  company: string;
  status: NotionStatus; 
  priority: NotionPriority;
  estimatedValue: number;
  accountOwner: string;
  [key: string]: any;
}

export interface ColumnConfig {
  key: keyof NotionDataItem;
  title: string;
  defaultWidth?: number;
  minWidth?: number;
  isSortable?: boolean;
}

export interface ColumnState extends ColumnConfig {
  width: number;
}

export interface SortConfig {
  key: keyof NotionDataItem;
  direction: "ascending" | "descending";
}

export interface ResizingColumn {
  key: string;
  startX: number;
  startWidth: number;
}

export const DEFAULT_COLUMN_WIDTH = 150;
export const MIN_COLUMN_WIDTH = 80;
export const RESIZE_HANDLE_WIDTH = 8;





