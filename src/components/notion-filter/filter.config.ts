import { PropertyType } from "@/types/notion-filter.type";


export interface PropertyDefinition {
  label: string;
  value: string;
  type: PropertyType;
  options?: string[]; // For select, multi_select, status
}

export interface ConditionDefinition {
  label: string;
  value: string;
  applicablePropertyTypes: PropertyType[];
  valueComponent?: 'text' | 'number' | 'checkbox' | 'date' | 'select';
  valuePlaceholder?: string;
  hideValueInput?: boolean;
  inverseConditionValue?: string; // e.g., 'does_not_equal' for 'equals'
  unsupportedForNot?: boolean; // If true, applying NOT to this condition is problematic
}

export const AVAILABLE_PROPERTIES: PropertyDefinition[] = [
  { label: 'Company', value: 'Company', type: 'rich_text' },
  { label: 'Status', value: 'Status', type: 'select', options: ['Closed', 'Lead', 'Proposal', 'Lost'] },
  { label: 'Priority', value: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'] },
  { label: 'Est. Value', value: 'Estimated Value', type: 'number' },
];

export const CONDITIONS: ConditionDefinition[] = [
    // Checkbox
  { label: 'Is checked', value: 'equals', applicablePropertyTypes: ['checkbox'], valueComponent: 'checkbox', hideValueInput: false, inverseConditionValue: 'does_not_equal' }, // hideValueInput: false to show checkbox input
  { label: 'Is not checked', value: 'does_not_equal', applicablePropertyTypes: ['checkbox'], valueComponent: 'checkbox', hideValueInput: false, inverseConditionValue: 'equals' }, // hideValueInput: false

  // Date & Timestamp
  { label: 'Is', value: 'equals', applicablePropertyTypes: ['date', 'timestamp'], valueComponent: 'date', inverseConditionValue: 'not_equals_date', unsupportedForNot: true },
  { label: 'Is not', value: 'not_equals_date', applicablePropertyTypes: ['date', 'timestamp'], valueComponent: 'date', inverseConditionValue: 'equals', unsupportedForNot: true }, // Direct negation often not simple
  { label: 'Is before', value: 'before', applicablePropertyTypes: ['date', 'timestamp'], valueComponent: 'date', inverseConditionValue: 'on_or_after' },
  { label: 'Is after', value: 'after', applicablePropertyTypes: ['date', 'timestamp'], valueComponent: 'date', inverseConditionValue: 'on_or_before' },
  { label: 'Is on or before', value: 'on_or_before', applicablePropertyTypes: ['date', 'timestamp'], valueComponent: 'date', inverseConditionValue: 'after' },
  { label: 'Is on or after', value: 'on_or_after', applicablePropertyTypes: ['date', 'timestamp'], valueComponent: 'date', inverseConditionValue: 'before' },
  { label: 'Is empty', value: 'is_empty', applicablePropertyTypes: ['date', 'timestamp', 'multi_select', 'number', 'rich_text', 'select', 'status'], hideValueInput: true, inverseConditionValue: 'is_not_empty' },
  { label: 'Is not empty', value: 'is_not_empty', applicablePropertyTypes: ['date', 'timestamp', 'multi_select', 'number', 'rich_text', 'select', 'status'], hideValueInput: true, inverseConditionValue: 'is_empty' },

  // Multi-select
  { label: 'Contains', value: 'contains', applicablePropertyTypes: ['multi_select'], valueComponent: 'text', valuePlaceholder: "Enter value...", inverseConditionValue: 'does_not_contain' },
  { label: 'Does not contain', value: 'does_not_contain', applicablePropertyTypes: ['multi_select'], valueComponent: 'text', valuePlaceholder: "Enter value...", inverseConditionValue: 'contains' },

  // Number
  { label: 'Equals', value: 'equals', applicablePropertyTypes: ['number'], valueComponent: 'number', valuePlaceholder: "Enter number...", inverseConditionValue: 'does_not_equal' },
  { label: 'Does not equal', value: 'does_not_equal', applicablePropertyTypes: ['number'], valueComponent: 'number', valuePlaceholder: "Enter number...", inverseConditionValue: 'equals' },
  { label: 'Greater than', value: 'greater_than', applicablePropertyTypes: ['number'], valueComponent: 'number', valuePlaceholder: "Enter number...", inverseConditionValue: 'less_than_or_equal_to' },
  { label: 'Less than', value: 'less_than', applicablePropertyTypes: ['number'], valueComponent: 'number', valuePlaceholder: "Enter number...", inverseConditionValue: 'greater_than_or_equal_to' },
  { label: 'Greater than or equal to', value: 'greater_than_or_equal_to', applicablePropertyTypes: ['number'], valueComponent: 'number', valuePlaceholder: "Enter number...", inverseConditionValue: 'less_than' },
  { label: 'Less than or equal to', value: 'less_than_or_equal_to', applicablePropertyTypes: ['number'], valueComponent: 'number', valuePlaceholder: "Enter number...", inverseConditionValue: 'greater_than' },

  // Rich Text
  { label: 'Is', value: 'equals', applicablePropertyTypes: ['rich_text', 'select', 'status'], valueComponent: 'text', valuePlaceholder: "Enter text...", inverseConditionValue: 'does_not_equal' },
  { label: 'Is not', value: 'does_not_equal', applicablePropertyTypes: ['rich_text', 'select', 'status'], valueComponent: 'text', valuePlaceholder: "Enter text...", inverseConditionValue: 'equals' },
  { label: 'Contains', value: 'contains', applicablePropertyTypes: ['rich_text'], valueComponent: 'text', valuePlaceholder: "Enter text...", inverseConditionValue: 'does_not_contain' },
  { label: 'Does not contain', value: 'does_not_contain', applicablePropertyTypes: ['rich_text'], valueComponent: 'text', valuePlaceholder: "Enter text...", inverseConditionValue: 'contains' },
  { label: 'Starts with', value: 'starts_with', applicablePropertyTypes: ['rich_text'], valueComponent: 'text', valuePlaceholder: "Enter text...", unsupportedForNot: true },
  { label: 'Ends with', value: 'ends_with', applicablePropertyTypes: ['rich_text'], valueComponent: 'text', valuePlaceholder: "Enter text...", unsupportedForNot: true },
];

export const MAX_FILTER_DEPTH = 2; // Configurable nesting depth, Notion API default is 2
export const DEFAULT_LOGICAL_OPERATOR = 'and';

export const getConditionsForPropertyType = (type: PropertyType): ConditionDefinition[] => {  
  return CONDITIONS.filter(cond => cond.applicablePropertyTypes.includes(type));
};

export const getPropertyDefinition = (value: string): PropertyDefinition | undefined => {
  return AVAILABLE_PROPERTIES.find(p => p.value === value);
};

export const getConditionDefinition = (value: string, propertyType?: PropertyType): ConditionDefinition | undefined => {
  if (!propertyType) return CONDITIONS.find(c => c.value === value); // Less specific, might be ambiguous
  // More specific: find condition that applies to the property type
  const conditions = getConditionsForPropertyType(propertyType);
  return conditions.find(c => c.value === value);
};

