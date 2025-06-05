import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'

import { FilterableNotionTable, NotionFilterBuilder, NotionTable } from '@/components';
import { fetchNotionData } from '@/server';
import { expectedNotionData as filterData } from '../mock-data';
import React from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogTrigger, DialogContent } from '@/components/ui/dialog';

jest.mock('lucide-react', ()=> ({
    Loader2: jest.fn(),
    Filter: jest.fn(),
    RotateCcw: jest.fn(),
}));

jest.mock('../../components/ui/custom-tooltip', () => ({
    CustomTooltip: jest.fn(),
}));


jest.mock('../../components/notion-filter/filter-builder', () => ({
    NotionFilterBuilder: jest.fn(),
}));

jest.mock('../../components/ui/dialog', () => { 
    return {
        Dialog: jest.fn(),
        DialogContent: jest.fn(),
        DialogHeader:jest.fn(),
        DialogTitle: jest.fn(),
        DialogTrigger: jest.fn(),
    };
});

jest.mock('../../hooks/use-toast', () => ({
    useToast: jest.fn(() => ({
        toast: jest.fn(),
    })),
}));

jest.mock('../../components/notion-table/notion-table', () => ({
    NotionTable: jest.fn(),
}));

jest.mock('../../server/notion-table.server', () => ({
    fetchNotionData: jest.fn(() => Promise.resolve([])),
}));

describe('filter dialog', () => { 
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the filter dialog', () => {
        render(
            <FilterableNotionTable initialData={[]} />
        );
        const filterDialog = screen.getByText('Notion Database View');
        expect(filterDialog).toBeInTheDocument();
    });

    it('should render the filter builder', async () => {
        (fetchNotionData as any).mockReturnValue(Promise.resolve(filterData));

        JSON.stringify = jest.fn().mockImplementationOnce(() => {
            return '{}'
        });

    
         (NotionTable as any).mockImplementation((props: any) => {             
             return (
                <table data-testid="mock-notion-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Estimated Value</th>
                    <th>Account Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {props.initialData.map((item: any) => (
                    <tr key={item.id}>
                      <td>{item.Name}</td>
                      <td>{item.Company}</td>
                      <td>{item.Status}</td>
                      <td>{item.Priority}</td>
                      <td>{item.EstimatedValue}</td>
                      <td>{item.AccountOwner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
             ); 
         });

        (NotionFilterBuilder as any).mockImplementation((props: any) => {
            return(
                <div>
                    <button onClick={() => props.onApplyFilters( {
                    filter: {
                        and: [
                            {
                                property: 'Priority',
                                select: {
                                    is_not_empty: true
                                }
                            }
                        ]
                    },
                    maxNestingLevel: 2
                })}>
                        Apply Filters</button>
                    <button onClick={props.onCloseDialog}>Reset</button>
                </div>
            );
        });
       
        (Dialog as any).mockImplementation((props: any) => {
            const childrenArray = React.Children.toArray(props.children);
                return (
                    <div data-testid="mock-dialog-root">
                        <button data-testid="mock-dialog-trigger" onClick={props.onOpenChange}>Open Dialog</button>
                        {childrenArray[0]}
                        {props.open && childrenArray[1]}
                    </div>
                );
            });

       
        (DialogContent as any).mockImplementation((props: any) => {
            const childrenArray = React.Children.toArray(props.children);            
            return (
                <div data-testid="mock-dialog-content">
                    {childrenArray[0]}
                    {childrenArray[1]}
                </div>
            );
        });

        (DialogHeader as any).mockImplementation(() => <div>Header</div>);

        (DialogTitle as any).mockImplementation(() => <h2>Title</h2>);

        (DialogTrigger as any).mockImplementation(() => <></>); 
        render(
            <FilterableNotionTable initialData={[]} />
        );

        await act(async () => {
            const openDialog = screen.getByText('Open Dialog');
            openDialog.click();
        });

        await act( async () => {
            const applyFilters = screen.getByText('Apply Filters');
            applyFilters.click();
        });

        expect(NotionTable).toHaveBeenCalled();
        expect(NotionFilterBuilder).toHaveBeenCalled();
        expect(Dialog).toHaveBeenCalled();
        
        expect(screen.getByText('Test Company 5')).toBeInTheDocument();        
    });
})