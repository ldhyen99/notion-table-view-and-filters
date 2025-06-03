
import axios from 'axios';

export interface NotionLink {
  label: string;
  url: string;
}

export type NotionStatus = 'Closed' | 'Lead' | 'Proposal' | 'Lost';
export type NotionPriority = 'High' | 'Medium' | 'Low';

export interface NotionDataItem {
  id: string;
  Name: string | NotionLink;
  Company: string | NotionLink;
  Status: NotionStatus;
  Priority: NotionPriority;
  EstimatedValue: number;
  AccountOwner: string | NotionLink;
  [key: string]: string | number | NotionLink | NotionStatus | NotionPriority;
}

interface ApiDataItem {
  name: string;
  company: string;
  status: string; 
  priority: NotionPriority;
  estimatedValue: number;
  accountOwner: string;
  [key: string]: any;
}

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
    default:
      if (['Closed', 'Lead', 'Proposal', 'Lost'].includes(apiStatus as NotionStatus)) {
        return apiStatus as NotionStatus;
      }
      console.warn(`Unknown API status: ${apiStatus}, defaulting to Proposal`);
      return 'Proposal';
  }
}

const ORIGINAL_DATA_SOURCE_URL = 'https://notion-server-nine.vercel.app/api/data';
const SORT_API_BASE_URL = 'https://notion-server-nine.vercel.app/api/sort'; 


export async function fetchNotionData(
  sortProperty?: keyof NotionDataItem,
  sortDirection?: 'ascending' | 'descending'
): Promise<NotionDataItem[]> {
  let url: string;

  if (sortProperty) {
    // Ensure sortProperty is a string key from NotionDataItem that the API can handle
    const propertyKey = String(sortProperty); 
    url = `${SORT_API_BASE_URL}?property=${encodeURIComponent(propertyKey)}`;
    if (sortDirection) {
      url += `&direction=${sortDirection}`;
    }
  } else {
    url = ORIGINAL_DATA_SOURCE_URL;
  }

  try {
    const response = await axios.get<ApiDataItem[]>(url);
    if (response.data && Array.isArray(response.data)) {
      return response.data.map((item, index) => ({
        id: item.id || (index + 1).toString(),
        Name: item.name,
        Company: item.company,
        Status: mapApiStatusToNotionStatus(item.status),
        Priority: item.priority, 
        EstimatedValue: item.estimatedValue,
        AccountOwner: item.accountOwner,
      }));
    }
    console.error('API did not return an array or valid data:', response.data);
    return [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error fetching data from ${url}:`, error.message, error.response?.data);
    } else {
      console.error(`Error fetching data from ${url}:`, error);
    }
    return [];
  }
}
