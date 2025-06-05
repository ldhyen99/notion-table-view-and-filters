import { MAX_FILTER_DEPTH } from '@/components/notion-filter/filter.config';
import { NotionFilterApiPayload } from '@/types/notion-filter.type';
import { ApiDataTableItem, NotionDataItem, NotionStatus } from '@/types/notion-table.type';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + '/data';

function mapApiStatusToNotionStatus(apiStatus: string): NotionStatus {
  const lowerCaseStatus = apiStatus?.toLowerCase();
  switch (lowerCaseStatus) {
    case 'closed':
      return 'Closed';
    case 'lead':
      return 'Lead';
    case 'lost':
      return 'Lost';
    case 'proposal': 
      return 'Proposal';
    case 'qualified':
      return 'Qualified';
    case 'negotiation':
      return 'Negotiation';
    default:
      if (['Closed', 'Lead', 'Proposal', 'Lost'].includes(apiStatus as NotionStatus)) {
        return apiStatus as NotionStatus;
      }
      console.warn(`Unknown API status: ${apiStatus}, defaulting to Proposal`);
      return 'Proposal';
  }
}

// Helper function to map API data items to Notion data items
function mapApiDataToNotionData(apiData: ApiDataTableItem[]): NotionDataItem[] {
  if (apiData && Array.isArray(apiData)) {
    return apiData.map((item, index) => ({
      id: item.id || (index + 1).toString(),
      Name: item.name,
      Company: item.company,
      Status: mapApiStatusToNotionStatus(item.status),
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
    const response = await axios.post<ApiDataTableItem[]>(API_BASE_URL, apiPayloadBody);
    return mapApiDataToNotionData(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error during POST request to ${API_BASE_URL}:`, error.message, error.response?.data || error.toJSON());
    } else {
      console.error(`Error during POST request to ${API_BASE_URL}:`, error);
    }
    return [];
  }
}
