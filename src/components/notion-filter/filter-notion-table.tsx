
"use client";

import React, { useState, useCallback } from 'react';
import { Loader2, Filter, RotateCcw } from 'lucide-react';

import { NotionFilterApiPayload } from '@/types/notion-filter.type';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NotionDataItem } from '@/types/notion-table.type';
import { fetchNotionData } from '@/server/notion-table.server';
import { useToast } from '@/hooks/use-toast';

import { NotionFilterBuilder } from './filter-builder';
import { NotionTable } from '../notion-table';
import { CustomTooltip } from '../ui/custom-tooltip';

interface FilterableNotionTableProps {
  initialData: NotionDataItem[];
}

export function FilterableNotionTable({ initialData: serverInitialData }: FilterableNotionTableProps) {
  const [tableData, setTableData] = useState<NotionDataItem[]>(serverInitialData);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<NotionFilterApiPayload | undefined>(undefined);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [resetToken, setResetToken] = useState(0); // Token to force NotionTable remount
  const { toast } = useToast();


  const handleApplyFilters = useCallback(async (filterPayload: NotionFilterApiPayload) => {        
    setIsLoading(true);
    setCurrentFilter(filterPayload); 
    try {
      const filteredData = await fetchNotionData(undefined, undefined, filterPayload);
      setTableData(filteredData);
      setResetToken(prev => prev + 1);
    } catch (error) {
      console.error("Error applying filters:", error);
    } finally {
      setIsLoading(false);
      setIsFilterDialogOpen(false);
    }
  }, []);

  const handleCloseFilterDialog = () => {
    setIsFilterDialogOpen(false);
  };

  const handleResetAllData = async () => {
    setIsLoading(true);
    setCurrentFilter(undefined); // Clear any active filter
    try {
      const defaultData = await fetchNotionData(); // Fetches from the base /api/data endpoint      
      setTableData(defaultData);
      setResetToken(prev => prev + 1); // Increment token to force NotionTable remount and clear its internal sort
      toast({
        title: "Data Reset",
        description: "Table has been reset to the default view.",
      });
    } catch (error) {
      console.error("Error resetting data:", error);
      toast({
        title: "Error Resetting Data",
        description: "Could not reset data to default. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <Card className="shadow-xl rounded-xl overflow-hidden mt-6" data-ai-hint="productivity table">
        <CardHeader className="bg-card border-b flex flex-row items-center justify-between">
          <CardTitle className="font-headline text-2xl">Notion Database View</CardTitle>
          <div className="flex items-center gap-2">
             <CustomTooltip content={<p>Reload data</p>}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetAllData}
                  aria-label="Reset all data and filters"
                  disabled={isLoading}
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </CustomTooltip>
              <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
                 <CustomTooltip content={<p>Advanced Filters</p>}>
                 <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Toggle filters"
                    disabled={isLoading}
                  >
                    <Filter className="h-5 w-5" />
                </Button>
                </DialogTrigger>
              </CustomTooltip>
              <DialogContent className="sm:max-w-[700px] md:max-w-[800px] lg:max-w-[900px] max-h-[90vh] flex flex-col" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle>Filter Database</DialogTitle>
                </DialogHeader>
                <div className="flex-grow overflow-auto">
                  <NotionFilterBuilder 
                    onApplyFilters={handleApplyFilters} 
                    onCloseDialog={handleCloseFilterDialog} 
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/70 z-20 rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <NotionTable initialData={tableData} key={`${JSON.stringify(currentFilter)}-${resetToken}`} currentFilter={currentFilter} />
        </CardContent>
      </Card>
  );
}
