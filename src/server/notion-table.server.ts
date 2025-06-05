import { MAX_FILTER_DEPTH } from '@/components/notion-filter/filter.config';
import { NotionFilterApiPayload } from '@/types/notion-filter.type';
import { ApiDataTableItem, NotionDataItem } from '@/types/notion-table.type';
import { publicAPI } from './httpService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + '/data';

// Helper function to map API data items to Notion data items
function mapApiDataToNotionData(apiData: ApiDataTableItem[]): NotionDataItem[] {
  if (apiData && Array.isArray(apiData)) {
    return apiData.map((item) => ({
      id: item.id,
      Name: item.name,
      Company: item.company,
      Status: item.status,
      Priority: item.priority,
      EstimatedValue: item.estimatedValue,
      AccountOwner: item.accountOwner
    }));
  }
  console.error('API did not return an array or valid data:', apiData);
  return [];
}

export async function fetchNotionData(
  sortProperty?: keyof NotionDataItem,
  sortDirection?: 'ascending' | 'descending',
  filterPayload?: NotionFilterApiPayload
): Promise<NotionDataItem[]> {
  const hasFilter = Object.keys(filterPayload ?? {}).length > 0;
  const hasSort = !!sortProperty;

  let apiPayloadBody = {}
  if (hasFilter) {
    apiPayloadBody = {
      filter: filterPayload!.filter,
      maxNestingLevel: MAX_FILTER_DEPTH
    };
  }
  if (hasSort) {
    const SORT_PROPERTY_MAPPING: Record<string, string> = {
      'EstimatedValue': 'Estimated Value',
      'AccountOwner': 'Account Owner'
    };

    let mapSortProperty = SORT_PROPERTY_MAPPING[sortProperty] || sortProperty;
    apiPayloadBody = {
      ...apiPayloadBody,
      sort: { property: String(mapSortProperty), direction: sortDirection || 'ascending' }
    };
  }

  try {
    const response = await publicAPI.post<ApiDataTableItem[]>(API_BASE_URL, apiPayloadBody);    
    return mapApiDataToNotionData(response)
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
}
