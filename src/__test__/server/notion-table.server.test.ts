
require('dotenv').config();
import { fetchNotionData } from '../../server/notion-table.server';
import { expectedNotionData, mockApiData } from '../mock-data';
import { publicAPI } from '../../server/httpService';


describe('notion-table.server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

    it('fetches data without filters or sorting', async () => {
        jest.spyOn(publicAPI, 'post').mockResolvedValue(mockApiData);
        const result = await fetchNotionData();
        expect(result).toEqual(expectedNotionData);
    });

    it('fetches data with filters', async () => {
        jest.spyOn(publicAPI, 'post').mockResolvedValue(mockApiData);
        const filter = {"filter":{"and":[{"property":"Priority","select":{"is_not_empty":true}}]},"maxNestingLevel":2}
        const result = await fetchNotionData(undefined, undefined, filter);
        expect(publicAPI.post).toHaveBeenCalledWith(
            'http://localhost:3000/data',
            {
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
            }
        );
        expect(result).toEqual(expectedNotionData);
    }); 

    it('fetches data with sorting', async () => {
        jest.spyOn(publicAPI, 'post').mockResolvedValue(mockApiData);
        const result = await fetchNotionData('EstimatedValue', 'descending');

        expect(publicAPI.post).toHaveBeenCalledWith(
            'http://localhost:3000/data',
            {
                sort: {
                    property: 'Estimated Value',
                    direction: 'descending'
                }
            }
        );
        expect(result).toEqual(expectedNotionData);
    });

    it('handles object API response', async () => {
        jest.spyOn(publicAPI, 'post').mockResolvedValue({});
        const result = await fetchNotionData();
        expect(result).toEqual([]);
    });

    it('handles API errors', async () => {
        jest.spyOn(publicAPI, 'post').mockRejectedValue(new Error('API error'));
        const result = await fetchNotionData();
        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Error fetching data:', new Error('API error'));
    });
})