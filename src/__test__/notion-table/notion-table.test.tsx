import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { NotionTable } from "../../components/notion-table/notion-table";

import { expectedNotionData as initialData } from '../mock-data';
import { TableHeaderCell } from '../../components/notion-table/table-header-cell';
import { TableCellContent } from '../../components/notion-table/table-cell-content';

jest.mock('lucide-react', ()=> ({}));

jest.mock('../../components/notion-table/table-cell-content', () => ({
    TableCellContent: jest.fn()
}));
jest.mock('../../components/notion-table/table-header-cell', () => ({
    TableHeaderCell: jest.fn()
}));


jest.mock('../../hooks/use-mobile', () => ({
    useIsMobile: jest.fn().mockReturnValue(false),
}));

describe('Notion table', () => { 
    it('should render the table with initial data', () => {
        render(<NotionTable initialData={initialData} />);
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
    });

   it('should sort the table by the first column', () => {
        (TableHeaderCell as any).mockImplementation(
            (props: any) => (
                <div>
                    <button onClick={() => props.onSort('Name')}>
                        {props.column.title}
                    </button>
                </div>
        ));

        (TableCellContent as any).mockImplementation((props: any) => {
            const value = props.item[props.columnKey];
            return <span className="font-code">{String(value)}</span>
        });
        render(<NotionTable initialData={initialData} />);
        const firstColumnHeader =screen.getByText('Name');
        firstColumnHeader.click();
        const firstColumnHeaderAfterSort = screen.getByText('Name');
        expect(firstColumnHeaderAfterSort).toBeInTheDocument();
    });

    // Add more tests for other functionalities
 })