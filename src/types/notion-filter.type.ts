export type PropertyType = 'checkbox' | 'date' | 'multi_select' | 'number' | 'rich_text' | 'select' | 'timestamp' | 'status';
export type LogicalOperator = 'and' | 'or';

export interface SimpleFilterRule {
    id: string;
    type: 'rule';
    property?: string;
    propertyLabel?: string;
    propertyType?: PropertyType;
    condition?: string;
    conditionLabel?: string;
    value?: any;
    isNot?: boolean; // For NOT operator
}

export interface FilterGroup {
    id: string;
    type: 'group';
    logicalOperator: LogicalOperator;
    children: Array<SimpleFilterRule | FilterGroup>;
    level: number;
    isNot?: boolean; // For NOT operator
  }
  
export type FilterItem = SimpleFilterRule | FilterGroup;

// Root filter state is always a group
export type RootFilterState = FilterGroup;

// For constructing the API payload
export interface NotionApiCondition {
    [conditionKey: string]: any;
  }

export interface NotionApiFilterRule {
    property: string;
    [propertyType: string]: NotionApiCondition | string;
}
export interface NotionApiCompoundFilter {
    and?: Array<NotionApiFilterRule | NotionApiCompoundFilter>;
    or?: Array<NotionApiFilterRule | NotionApiCompoundFilter>;
}

export type NotionApiFilterObject = NotionApiFilterRule | NotionApiCompoundFilter;

export type NotionFilterApiPayload = {
    filter?: NotionApiFilterObject;
    maxNestingLevel?: number; // Added for backend
};