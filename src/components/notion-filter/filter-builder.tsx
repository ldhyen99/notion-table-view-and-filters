
"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { RootFilterState, FilterGroup as FilterGroupType, SimpleFilterRule, FilterItem, NotionApiFilterRule, NotionApiCompoundFilter, NotionApiFilterObject, NotionFilterApiPayload } from '@/types/notion-filter.type';
import { DEFAULT_LOGICAL_OPERATOR, MAX_FILTER_DEPTH, getConditionDefinition, getPropertyDefinition } from './filter.config';
import { FilterGroupComponent } from './filter-group';

interface NotionFilterBuilderProps {
  onApplyFilters: (filterPayload: NotionFilterApiPayload) => void;
  initialFilterState?: RootFilterState;
  onCloseDialog?: () => void;
}

let ruleIdCounter = Date.now();
const generateRuleId = () => `rule-${ruleIdCounter++}-${Math.random().toString(36).substr(2, 5)}`;
let groupIdCounter = Date.now();
const generateGroupId = () => `group-${groupIdCounter++}-${Math.random().toString(36).substr(2, 5)}`;

const initialRootState: RootFilterState = {
  id: generateGroupId(),
  type: 'group',
  logicalOperator: DEFAULT_LOGICAL_OPERATOR,
  children: [],
  level: 0,
  isNot: false,
};

export const NotionFilterBuilder: React.FC<NotionFilterBuilderProps> = ({
  onApplyFilters,
  initialFilterState = JSON.parse(JSON.stringify(initialRootState)),
  onCloseDialog,
}) => {
  const [rootFilter, setRootFilter] = useState<RootFilterState>(initialFilterState);
  const { toast } = useToast();

  const recursivelyUpdateState = (
    currentGroup: FilterGroupType,
    targetGroupId: string,
    updateFn: (group: FilterGroupType) => FilterGroupType
  ): FilterGroupType => {
    if (currentGroup.id === targetGroupId) {
      return updateFn(currentGroup);
    }
    return {
      ...currentGroup,
      children: currentGroup.children.map(child => {
        if (child.type === 'group') {
          return recursivelyUpdateState(child, targetGroupId, updateFn);
        }
        return child;
      })
    };
  };

  const handleUpdateGroup = useCallback((groupId: string, updates: Partial<FilterGroupType>) => {
     setRootFilter(prevRoot => recursivelyUpdateState(prevRoot, groupId, group => ({ ...group, ...updates })));
  }, []);

  const handleAddRuleToGroup = useCallback((groupId: string) => {
    setRootFilter(prevRoot => recursivelyUpdateState(prevRoot, groupId, group => ({
      ...group,
      children: [...group.children, { id: generateRuleId(), type: 'rule', isNot: false }]
    })));
  }, []);

  const handleAddSubgroupToGroup = useCallback((groupId: string) => {
     setRootFilter(prevRoot => recursivelyUpdateState(prevRoot, groupId, group => {
        if (group.level < MAX_FILTER_DEPTH -1) {
            return {
                ...group,
                children: [
                    ...group.children,
                    { id: generateGroupId(), type: 'group', logicalOperator: DEFAULT_LOGICAL_OPERATOR, children: [], level: group.level + 1, isNot: false }
                ]
            };
        }
        toast({ title: "Maximum filter depth reached.", variant: "destructive", description: `Cannot add subgroup at level ${group.level + 2}. Limit is ${MAX_FILTER_DEPTH}.` });
        return group;
     }));
  }, [toast]);

  const handleUpdateRuleInGroup = useCallback((groupId: string, ruleId: string, updates: Partial<SimpleFilterRule>) => {
    setRootFilter(prevRoot => recursivelyUpdateState(prevRoot, groupId, group => ({
      ...group,
      children: group.children.map(child => (child.id === ruleId && child.type === 'rule' ? { ...child, ...updates } : child))
    })));
  }, []);

  const handleRemoveRuleFromGroup = useCallback((groupId: string, ruleId: string) => {
     setRootFilter(prevRoot => recursivelyUpdateState(prevRoot, groupId, group => ({
      ...group,
      children: group.children.filter(child => child.id !== ruleId)
    })));
  }, []);
  
  const handleRemoveGroup = useCallback((groupIdToRemove: string) => {
    const removeNestedGroup = (currentItems: FilterItem[], targetId: string): FilterItem[] => {
        return currentItems.filter(item => item.id !== targetId).map(item => {
            if (item.type === 'group') {
                return {...item, children: removeNestedGroup(item.children, targetId)};
            }
            return item;
        });
    };
    setRootFilter(prevRoot => ({
        ...prevRoot,
        children: removeNestedGroup(prevRoot.children, groupIdToRemove)
    }));
  }, []);

  const getUnsupportedNotConditionsRecursive = (item: FilterItem, isParentEffectivelyNot: boolean): string[] => {
    let unsupported: string[] = [];
    const effectiveIsNot = isParentEffectivelyNot ? !(item.isNot ?? false) : (item.isNot ?? false);

    if (item.type === 'rule' && effectiveIsNot) {
        const propertyDef = getPropertyDefinition(item.property || '');
        const conditionDef = getConditionDefinition(item.condition || '', propertyDef?.type);
        if (conditionDef?.unsupportedForNot) {
            unsupported.push(`"${conditionDef.label}" for "${propertyDef?.label || item.property}"`);
        } else if (item.propertyType === 'checkbox') {
            // Checkbox NOT is generally supported by inverting value for 'equals' condition.
            // If condition is not 'equals' or 'does_not_equal', it might be an issue with NOT,
            // but typically checkbox properties only use these two.
        } else if (!conditionDef?.inverseConditionValue && !conditionDef?.hideValueInput) {
            // If no inverse, not a type like 'is_empty', and not checkbox, consider problematic for NOT
             unsupported.push(`"${conditionDef?.label || 'Unknown condition'}" for "${propertyDef?.label || item.property}" (no direct inverse)`);
        }
    } else if (item.type === 'group') {
        // If group itself is effectively NOT, then De Morgan's applies.
        // The logical operator flips, and NOT is pushed to children.
        // The 'effectiveIsNot' for this group is already passed as 'isParentEffectivelyNot' to its children.
        for (const child of item.children) {
            unsupported = unsupported.concat(getUnsupportedNotConditionsRecursive(child, effectiveIsNot));
        }
    }
    return [...new Set(unsupported)]; // Unique conditions
  };
  
  const convertToApiPayload = (item: FilterItem, parentEffectiveNot: boolean = false): NotionApiFilterObject | null => {
    const currentItemIsNot = item.isNot ?? false;
    const effectiveIsNot = parentEffectiveNot ? !currentItemIsNot : currentItemIsNot;

    if (item.type === 'rule') {
      if (!item.property || !item.propertyType || !item.condition) return null;

      let apiCondition = item.condition;
      let apiValue = item.value;
      const conditionDef = getConditionDefinition(item.condition, item.propertyType);

      if (!conditionDef) return null; // Should not happen if UI is synced with config

      if (effectiveIsNot) {
        if (conditionDef.unsupportedForNot) return null; // This rule makes the filter invalid

        if (item.propertyType === 'checkbox') {
          // Notion API for checkbox is always { "checkbox": { "equals": <boolean> } }
          // 'is checked' (UI rule.value=true, condition='equals') + NOT -> 'is not checked' (API equals: false)
          // 'is not checked' (UI rule.value=false, condition='equals') + NOT -> 'is checked' (API equals: true)
          // 'is checked' (UI rule.value=true, condition='does_not_equal') + NOT -> 'is checked' (API equals: true) (this case is weird, UI should prevent)
          // 'is not checked' (UI rule.value=false, condition='does_not_equal') + NOT -> 'is not checked' (API equals:false) (this case is weird)

          if (item.condition === 'equals') {
             apiValue = !(item.value === true); // Invert the boolean state
          } else if (item.condition === 'does_not_equal') {
             apiValue = (item.value === true); // NOT (does_not_equal true) means equals true
          } else {
             return null; // Unsupported checkbox condition for NOT
          }
          apiCondition = 'equals'; // API always uses 'equals' for checkbox
        } else if (conditionDef.inverseConditionValue) {
          apiCondition = conditionDef.inverseConditionValue;
        } else if (conditionDef.hideValueInput) { 
            // This implies conditions like 'is_empty' or 'is_not_empty'.
            // Their inverse is handled by inverseConditionValue. If not, it's an issue.
             return null; // Should have an inverse if it's a toggle-like condition
        } else {
            return null; // Cannot invert this rule, caught by validation
        }
      }
      
      const finalConditionDef = getConditionDefinition(apiCondition, item.propertyType);
      let payloadValue = apiValue;
      if (finalConditionDef?.hideValueInput && item.propertyType !== 'checkbox') { // Checkbox value is already boolean
        payloadValue = true; 
      }


      return {
        property: item.property,
        [item.propertyType]: { [apiCondition]: payloadValue },
      } as NotionApiFilterRule;
    }

    if (item.type === 'group') {
      const groupLogicalOperator = effectiveIsNot 
        ? (item.logicalOperator === 'and' ? 'or' : 'and') // De Morgan's: flip operator
        : item.logicalOperator;
      
      const childrenPayloads = item.children
        .map(child => convertToApiPayload(child, effectiveIsNot)) // Pass group's effective NOT status to children
        .filter(Boolean) as Array<NotionApiFilterRule | NotionApiCompoundFilter>;

      if (childrenPayloads.length === 0) return null;
      if (childrenPayloads.length === 1 && !effectiveIsNot) { // Single child, no group NOT inversion needed at this level
         // If the group was NOT, and it has one child, the payload is just the NOT of that child.
         // The child's conversion already handled its own NOT.
         // Example: NOT (GROUP (RULE A)) -> NOT (RULE A)
         // But if the child itself was a group, Notion expects the AND/OR wrapper.
         // Notion might not need a group for a single child if the parent group wasn't negated.
         // However, if the parent group *was* negated (effectiveIsNot = true),
         // then the structure { [flipped_operator]: [child_payload] } is necessary to represent the negation.
         // For simplicity and consistency, always wrap if childrenPayloads.length > 0
         // unless it's a single rule and no group-level NOT.
         // The case childrenPayloads.length === 1 means the child is already a valid NotionApiFilterObject.
         // If the group itself wasn't NOT, and there's one child, return that child directly.
         // return childrenPayloads[0];
      }


      return {
        [groupLogicalOperator]: childrenPayloads,
      } as NotionApiCompoundFilter;
    }
    return null;
  };

  const handleApply = () => {
    const unsupportedConditions = getUnsupportedNotConditionsRecursive(rootFilter, rootFilter.isNot ?? false);
    if (unsupportedConditions.length > 0) {
        toast({
            title: "Unsupported NOT Condition(s)",
            description: `The 'NOT' operator cannot be reliably applied to: ${unsupportedConditions.join(', ')}. Please revise your filter.`,
            variant: "destructive",
            duration: 7000,
        });
        return;
    }

    const apiFilterObject = convertToApiPayload(rootFilter, rootFilter.isNot ?? false);
    let finalPayload: NotionFilterApiPayload = {};

    if (apiFilterObject) {
        finalPayload = { filter: apiFilterObject, maxNestingLevel: MAX_FILTER_DEPTH };
    } else if (rootFilter.children.length === 0 && !(rootFilter.isNot && rootFilter.children.length > 0) ) { 
        finalPayload = { maxNestingLevel: MAX_FILTER_DEPTH }; 
    } else { 
         toast({
            title: "Invalid or Empty Filter",
            description: "The current filter configuration is invalid or results in an empty filter, possibly due to NOT operations on unsupported conditions. Please revise.",
            variant: "destructive",
            duration: 7000,
        });
        return;
    }
    
    onApplyFilters(finalPayload);
    if (onCloseDialog) onCloseDialog();
  };


  const noFiltersDefined = rootFilter.children.length === 0;

  return (
    <div className="flex flex-col h-full" data-ai-hint="filter builder interface">
      <ScrollArea className="flex-grow w-full pr-3 overflow-y-auto">
        <FilterGroupComponent
          group={rootFilter}
          onUpdateGroup={handleUpdateGroup}
          onAddRuleToGroup={handleAddRuleToGroup}
          onAddSubgroupToGroup={handleAddSubgroupToGroup}
          onUpdateRuleInGroup={handleUpdateRuleInGroup}
          onRemoveRuleFromGroup={handleRemoveRuleFromGroup}
          onRemoveGroup={handleRemoveGroup} 
          isRoot={true}
        />
      </ScrollArea>
      <div className="mt-6 flex justify-end gap-3 border-t pt-4">
      <Button onClick={handleApply} disabled={noFiltersDefined}>Apply Filters</Button>
      </div>
    </div>
  );
};
