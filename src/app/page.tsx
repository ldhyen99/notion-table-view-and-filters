import { NotionTable } from '@/components/notion-table/notion-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotionDataItem } from '@/types/notion-table.type';
import { fetchNotionData } from '@/server/notion-table.server';

export default async function Home() {
  const notionData: NotionDataItem[] = await fetchNotionData();

  return (
    <main className="flex-1 flex flex-col items-center justify-start p-4 md:p-8 bg-background">
      <div className="w-full max-w-7xl mx-auto">
        <Card className="shadow-xl rounded-xl overflow-hidden" data-ai-hint="productivity table">
          <CardHeader className="bg-card border-b">
            <CardTitle className="font-headline text-2xl">Notion Database View</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <NotionTable initialData={notionData} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
