import { NotionDataItem } from '@/types/notion-table.type';
import { fetchNotionData } from '@/server/notion-table.server';
import { FilterableNotionTable } from '@/components/notion-filter/filter-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';

export default async function Home() {
  const notionData: NotionDataItem[] = await fetchNotionData();
  
  return (
    <main className="flex-1 flex flex-col items-center justify-start p-4 md:p-8 bg-background">
      <div className="w-full max-w-7xl mx-auto">    
        <TooltipProvider>
          <FilterableNotionTable initialData={notionData} />
        </TooltipProvider>
      </div>
    </main>
  );
}
