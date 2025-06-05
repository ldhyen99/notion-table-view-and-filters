
"use client";
import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X as RemoveIcon, AlertTriangle } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SimpleFilterRule } from '@/types/notion-filter.type';
import { useIsMobile } from '@/hooks';

import { AVAILABLE_PROPERTIES, getConditionsForPropertyType, getPropertyDefinition, getConditionDefinition } from './filter.config';

interface FilterRuleProps {
  rule: SimpleFilterRule;
  onUpdate: (id: string, updates: Partial<SimpleFilterRule>) => void;
  onRemove: (id: string) => void;
  isFirstInGroup: boolean;
  parentLogicalOperator: 'and' | 'or';
}

export const FilterRule: React.FC<FilterRuleProps> = ({
  rule,
  onUpdate,
  onRemove,
  isFirstInGroup,
  parentLogicalOperator,
}) => {
  const selectedProperty = getPropertyDefinition(rule.property || '');
  const conditionsForProperty = selectedProperty ? getConditionsForPropertyType(selectedProperty.type) : [];
  const selectedCondition = getConditionDefinition(rule.condition || '', selectedProperty?.type);
  const isMobile = useIsMobile();
  const handlePropertyChange = (value: string) => {
    const newProperty = getPropertyDefinition(value);
    if (newProperty) {
      // Reset condition and value when property changes
      onUpdate(rule.id, { 
        property: newProperty.value, 
        propertyLabel: newProperty.label, 
        propertyType: newProperty.type, 
        condition: undefined, 
        value: undefined, 
        // isNot: rule.isNot // Keep isNot state or reset? For now, keep.
      });
    }
  };

  const handleConditionChange = (value: string) => {    
    const newCondition = getConditionDefinition(value, selectedProperty?.type);
     if (newCondition) {
      let updatedValue = rule.value;
      // Reset value if the new condition hides input or changes component type, or if it's a checkbox property
      if (newCondition.hideValueInput) {
         updatedValue = undefined; 
      } else if (rule.propertyType === 'checkbox' && (newCondition.value === 'equals' || newCondition.value === 'does_not_equal')) {
         updatedValue = false; // Default to false for checkbox 'equals'/'does_not_equal'
      } else if (newCondition.valueComponent !== (selectedCondition?.valueComponent)) {
         updatedValue = undefined;
      }
      onUpdate(rule.id, { 
        condition: newCondition.value, 
        conditionLabel: newCondition.label, 
        value: updatedValue,
        // isNot: rule.isNot // Keep isNot state
      });
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = selectedProperty?.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    onUpdate(rule.id, { value });
  };

  const handleCheckboxPropertyValueChange = (checked: boolean) => {
     // For property type 'checkbox', its direct value is boolean.
     // This is for when the PROPERTY is a checkbox, not when the condition input is a checkbox.
     // 'is checked' (equals) means value: true. 'is not checked' (does_not_equal) also means value: true internally, API maps later.
     // Let's simplify: rule.value stores the intended state of the checkbox (true for checked, false for unchecked)
     // when the condition is 'equals' or 'does_not_equal'.
     onUpdate(rule.id, { value: !!checked });
  };

  const handleDateChange = (date?: Date) => {
    onUpdate(rule.id, { value: date ? format(date, 'yyyy-MM-dd') : undefined });
  };

  const toggleIsNot = () => {
    onUpdate(rule.id, { isNot: !rule.isNot });
  };

  // Effective isNot considers parent group's isNot if we were to pass it down.
  // For now, isNotUnsupported only looks at the rule's own isNot and its condition.
  // The NotionFilterBuilder's getUnsupportedNotConditions handles combined effects.
  const isNotUnsupported = rule.isNot && selectedCondition?.unsupportedForNot;

  const renderValueInput = () => {
    if (!selectedProperty || !selectedCondition) return null;

    // Handle conditions that hide value input (e.g., is_empty, is_not_empty)
    if (selectedCondition.hideValueInput && selectedProperty.type !== 'checkbox') {
         // For 'is_empty'/'is_not_empty' on checkbox, Notion API implies value 'true', but no UI input needed.
         // For other types, these conditions don't take a user value.
        return null;
    }
    
    // Specific handling for property type 'checkbox'
    if (selectedProperty.type === 'checkbox') {
      if (selectedCondition.value === 'equals' || selectedCondition.value === 'does_not_equal') {
        // The rule.value for a checkbox property when condition is equals/does_not_equal
        // represents the state we're checking against (true for checked, false for unchecked).
        // The actual API payload is { checkbox: { equals: <boolean> } }
        // For 'is checked' (equals), UI value true -> API value true
        // For 'is not checked' (does_not_equal), UI value true -> API value false
        // The `convertToApiPayload` will handle the mapping based on rule.condition and rule.isNot
        return (
          <div className="flex items-center space-x-2 ml-2">
            <Checkbox
              id={`${rule.id}-checkbox-value`}
              checked={rule.value === true} // UI shows checkbox checked if rule.value is true
              onCheckedChange={handleCheckboxPropertyValueChange}
              className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
            />
            <label htmlFor={`${rule.id}-checkbox-value`} className="text-sm">
              {rule.value === true ? "Checked" : "Unchecked"}
            </label>
          </div>
        );
      }
      return null; // Other conditions for checkbox type (like is_empty) don't need a value input here
    }
    
    const valueComponentType = selectedCondition.valueComponent || 
    (['checkbox'].includes(selectedProperty.type) ? 'checkbox' :
    ['date', 'timestamp'].includes(selectedProperty.type) ? 'date' :
    selectedProperty.type === 'number' ? 'number' : 'text');

    if ((selectedProperty.type === 'select' || selectedProperty.type === 'status') && selectedProperty.options && (selectedCondition.value === 'equals' || selectedCondition.value === 'does_not_equal')) {
       return (
        <Select value={rule.value as string || ""} onValueChange={(val) => onUpdate(rule.id, { value: val })}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder={`Select ${selectedProperty.label}...`} />
          </SelectTrigger>
          <SelectContent>
            {selectedProperty.options.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    switch (valueComponentType) {
      case 'checkbox': 
        return <Checkbox checked={!!rule.value} onCheckedChange={(val) => onUpdate(rule.id, { value: !!val}) } className="ml-2" />;
      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[200px] justify-start text-left font-normal h-8 text-xs",
                  !rule.value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {rule.value ? format(new Date(rule.value as string), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={rule.value ? new Date(rule.value as string) : undefined}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      case 'number':
        return <Input type="number" value={rule.value as string || ''} onChange={handleValueChange} placeholder={selectedCondition.valuePlaceholder || "Enter value"} className="w-[180px] h-8 text-xs" />;
      default: // text
        return <Input type="text" value={rule.value as string || ''} onChange={handleValueChange} placeholder={selectedCondition.valuePlaceholder || "Enter value"} className="w-[180px] h-8 text-xs" />;
    }
  };

  useEffect(() => {
    onUpdate(rule.id, { 
      ...rule,  
      conditionLabel: '',
      condition: ''
     });
  }, [selectedProperty?.value]);

  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-y-2 sm:gap-x-2 p-2 pl-0 ml-0 rounded bg-background hover:bg-muted/50 transition-colors relative">

      <span className="text-xs font-medium text-muted-foreground min-w-[50px] whitespace-nowrap">
        {isFirstInGroup ? 'Where' : parentLogicalOperator.toUpperCase()}
      </span>

      <Button
        variant={rule.isNot ? "destructive" : "outline"}
        size="sm"
        onClick={toggleIsNot}
        className="px-2 py-1 h-8 text-xs"
      >
        {rule.isNot ? 'NOT' : 'IS'}
      </Button>

      <Select value={rule.property} onValueChange={handlePropertyChange}>
        <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs">
          <SelectValue placeholder="Select property..." />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_PROPERTIES.map(prop => (
            <SelectItem key={prop.value} value={prop.value} className="text-xs">{prop.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedProperty && (
        <Select value={rule.condition} onValueChange={handleConditionChange} disabled={!rule.property}>
          <SelectTrigger className="w-full sm:w-[170px] h-8 text-xs">
            <SelectValue placeholder="Select condition..." />
          </SelectTrigger>
          <SelectContent>
            {conditionsForProperty.map(cond => (
              <SelectItem key={cond.value} value={cond.value} className="text-xs">{cond.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selectedProperty && selectedCondition && renderValueInput()}
      
      {isNotUnsupported && (
        (() => {
          const commonMessage = `NOT with "${selectedCondition?.label || 'condition'}" on "${selectedProperty?.label || 'property'}" may be unsupported`;
          const message = isMobile ? commonMessage : `${commonMessage} or lead to unexpected behavior.`;
          const icon = <AlertTriangle className={cn("h-4 w-4 text-destructive", isMobile ? "mr-1 flex-shrink-0" : "ml-1")} />;

          return isMobile ? (
            <div className="flex items-center mt-1.5 ml-1">
              {icon}
              <p className="text-xs text-destructive">{message}</p>
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>{icon}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">{message}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })()
      )}

      <Button variant="ghost" size="icon" onClick={() => onRemove(rule.id)} className="ml-auto text-muted-foreground hover:text-destructive h-8 w-8">
        <RemoveIcon className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};
