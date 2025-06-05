
"use client";

import React from 'react';
import {  FilterGroup as FilterGroupType, SimpleFilterRule, LogicalOperator } from '@/types/notion-filter.type';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MAX_FILTER_DEPTH, DEFAULT_LOGICAL_OPERATOR } from './filter.config';
import { PlusCircle, Trash2, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FilterRule } from './filter-rule';

interface FilterGroupProps {
  group: FilterGroupType;
  onUpdateGroup: (id: string, updates: Partial<FilterGroupType>) => void;
  onRemoveGroup?: (id: string) => void;
  onAddRuleToGroup: (groupId: string) => void;
  onAddSubgroupToGroup: (groupId: string) => void;
  onUpdateRuleInGroup: (groupId: string, ruleId: string, updates: Partial<SimpleFilterRule>) => void;
  onRemoveRuleFromGroup: (groupId: string, ruleId: string) => void;
  isRoot?: boolean;
}

let ruleIdCounter = Date.now();
const generateRuleId = () => `rule-${ruleIdCounter++}-${Math.random().toString(36).substr(2, 5)}`;
let groupIdCounter = Date.now();
const generateGroupId = () => `group-${groupIdCounter++}-${Math.random().toString(36).substr(2, 5)}`;


export const FilterGroupComponent: React.FC<FilterGroupProps> = ({
  group,
  onUpdateGroup,
  onRemoveGroup,
  onAddRuleToGroup,
  onAddSubgroupToGroup,
  onUpdateRuleInGroup,
  onRemoveRuleFromGroup,
  isRoot = false,
}) => {
  const handleLogicalOperatorChange = (operator: LogicalOperator) => {
    onUpdateGroup(group.id, { logicalOperator: operator });
  };

  const toggleIsNot = () => {
    onUpdateGroup(group.id, { isNot: !group.isNot });
  };

  const canAddSubgroup = group.level < MAX_FILTER_DEPTH -1;

  return (
    <div className={cn("p-3 rounded-lg border relative",
        !isRoot ? "ml-6 border-blue-200 dark:border-blue-800" : "border-gray-200 dark:border-gray-700"
      )}
      style={{ marginLeft: isRoot ? 0 : `${group.level * 0.5}rem` }} 
      data-ai-hint="filter group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Button
            variant={group.isNot ? "destructive" : "outline"}
            size="sm"
            onClick={toggleIsNot}
            className="px-2 py-1 h-8 text-xs"
          >
            {group.isNot ? 'NOT Group' : 'Group'}
          </Button>
          <Select value={group.logicalOperator} onValueChange={handleLogicalOperatorChange as (value: string) => void}>
            <SelectTrigger className="w-[80px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="and">AND</SelectItem>
              <SelectItem value="or">OR</SelectItem>
            </SelectContent>
          </Select>
         {group.isNot && (
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <AlertTriangle className="h-5 w-5 text-destructive"/>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Applying NOT to a group may have limitations or lead to unexpected behavior with certain inner conditions.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
         )}
        </div>
        {!isRoot && onRemoveGroup && (
          <Button variant="ghost" size="icon" onClick={() => onRemoveGroup(group.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-1 pl-4 border-l border-dashed"> {/* Added indent for children */}
        {group.children.map((item, index) => (
          item.type === 'rule' ? (
            <FilterRule
              key={item.id}
              rule={item}
              onUpdate={(id, updates) => onUpdateRuleInGroup(group.id, id, updates)}
              onRemove={(id) => onRemoveRuleFromGroup(group.id, id)}
              isFirstInGroup={index === 0}
              parentLogicalOperator={group.logicalOperator}
            />
          ) : (
            <FilterGroupComponent
              key={item.id}
              group={item}
              onUpdateGroup={(id, updates) => {
                 const newChildren = group.children.map(child => child.id === id ? {...child, ...updates} : child) as Array<SimpleFilterRule | FilterGroupType>;
                 onUpdateGroup(group.id, { children: newChildren });
              }}
              onRemoveGroup={(id) => {
                const newChildren = group.children.filter(child => child.id !== id);
                onUpdateGroup(group.id, { children: newChildren });
              }}
              onAddRuleToGroup={(subGroupId) => {
                const newChildren = group.children.map(child => {
                    if (child.id === subGroupId && child.type === 'group') {
                        return {
                            ...child,
                            children: [...child.children, { id: generateRuleId(), type: 'rule', isNot: false }]
                        };
                    }
                    return child;
                }) as Array<SimpleFilterRule | FilterGroupType>;
                onUpdateGroup(group.id, {children: newChildren});
              }}
              onAddSubgroupToGroup={(subGroupId) => {
                 const newChildren = group.children.map(child => {
                    if (child.id === subGroupId && child.type === 'group' && child.level < MAX_FILTER_DEPTH -1) {
                        return {
                            ...child,
                            children: [...child.children, { id: generateGroupId(), type: 'group', logicalOperator: DEFAULT_LOGICAL_OPERATOR, children: [], level: child.level + 1, isNot: false }]
                        };
                    }
                    return child;
                }) as Array<SimpleFilterRule | FilterGroupType>;
                onUpdateGroup(group.id, {children: newChildren});
              }}
             onUpdateRuleInGroup={(subGroupId, ruleId, updates) => {
                const newChildren = group.children.map(child => {
                    if (child.id === subGroupId && child.type === 'group') {
                        return {
                            ...child,
                            children: child.children.map(subItem => subItem.id === ruleId ? {...subItem, ...updates} : subItem)
                        };
                    }
                    return child;
                }) as Array<SimpleFilterRule | FilterGroupType>;
                onUpdateGroup(group.id, {children: newChildren});
             }}
             onRemoveRuleFromGroup={(subGroupId, ruleId) => {
                const newChildren = group.children.map(child => {
                    if (child.id === subGroupId && child.type === 'group') {
                        return {
                            ...child,
                            children: child.children.filter(subItem => subItem.id !== ruleId)
                        };
                    }
                    return child;
                }) as Array<SimpleFilterRule | FilterGroupType>;
                onUpdateGroup(group.id, {children: newChildren});
             }}
            />
          )
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onAddRuleToGroup(group.id)} className="text-xs">
          <PlusCircle className="mr-1 h-3.5 w-3.5" /> Add Rule
        </Button>
        {canAddSubgroup && (
          <Button variant="outline" size="sm" onClick={() => onAddSubgroupToGroup(group.id)} className="text-xs">
            <PlusCircle className="mr-1 h-3.5 w-3.5" /> Add Group
          </Button>
        )}
      </div>
    </div>
  );
};
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');
