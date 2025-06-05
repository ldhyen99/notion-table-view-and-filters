import { NotionDataItem } from "@/types";

export const mockApiData = [
    {
      id: 1,
      name: 'Test Company 1',
      company: 'Company A',
      status: 'Lead',
      priority: 'High',
      estimatedValue: 10000,
      accountOwner: 'John Doe'
    },
    {
      id: 2,
      name: 'Test Company 2',
      company: 'Company B',
      status: 'Closed',
      priority: 'Medium',
      estimatedValue: 5000,
      accountOwner: 'user'
    },
    {
      id: 3,
      name: 'Test Company 3',
      company: 'Company B',
      status: 'Closed',
      priority: 'Low',
      estimatedValue: 9999,
      accountOwner: 'user'
    },
    {
      id: 4,
      name: 'Test Company 4',
      company: 'Company C',
      status: 'Qualified',
      priority: 'High',
      estimatedValue: 1234,
      accountOwner: 'user'
    },
    {
      id: 5,
      name: 'Test Company 5',
      company: 'Company D',
      status: 'Lost',
      priority: 'Low',
      estimatedValue: 23456,
      accountOwner: 'user'
    },
    {
      id: 6,
      name: 'Test Company 6',
      company: 'Company E',
      status: 'Negotiation',
      priority: 'Medium',
      estimatedValue: 9999,
      accountOwner: 'user'
    },
    {
      id: 7,
      name: 'Test Company 7',
      company: 'Company F',
      status: 'Proposal',
      priority: 'Low',
      estimatedValue: 150000,
      accountOwner: 'user'
    }
];

export const expectedNotionData: NotionDataItem[] = [
    {
        id: 1,
        Name: 'Test Company 1',
        Company: 'Company A',
        Status: 'Lead',
        Priority: 'High',
        EstimatedValue: 10000,
        AccountOwner: 'John Doe'
    },
    {
        id: 2,
        Name: 'Test Company 2',
        Company: 'Company B',
        Status: 'Closed',
        Priority: 'Medium',
        EstimatedValue: 5000,
        AccountOwner: 'user'
    },
    {
      id: 3,
      Name: 'Test Company 3',
      Company: 'Company B',
      Status: 'Closed',
      Priority: 'Low',
      EstimatedValue: 9999,
      AccountOwner: 'user'
    },
    {
      id: 4,
      Name: 'Test Company 4',
      Company: 'Company C',
      Status: 'Qualified',
      Priority: 'High',
      EstimatedValue: 1234,
      AccountOwner: 'user'
    },
    {
      id: 5,
      Name: 'Test Company 5',
      Company: 'Company D',
      Status: 'Lost',
      Priority: 'Low',
      EstimatedValue: 23456,
      AccountOwner: 'user'
    },
    {
      id: 6,
      Name: 'Test Company 6',
      Company: 'Company E',
      Status: 'Negotiation',
      Priority: 'Medium',
      EstimatedValue: 9999,
      AccountOwner: 'user'
    },
    {
      id: 7,
      Name: 'Test Company 7',
      Company: 'Company F',
      Status: 'Proposal',
      Priority: 'Low',
      EstimatedValue: 150000,
      AccountOwner: 'user'
    },
];

export const  mockCol= [
  { key: 'Name', title: 'Name', defaultWidth: 200, isSortable: true },
  { key: 'Company', title: 'Company', defaultWidth: 180, isSortable: true },
  { key: 'Status', title: 'Status', defaultWidth: 120, isSortable: true },
  { key: 'Priority', title: 'Priority', defaultWidth: 100, isSortable: true },
  { key: 'EstimatedValue', title: 'Est. Value', defaultWidth: 150, isSortable: true },
  { key: 'AccountOwner', title: 'Account Owner', defaultWidth: 180, isSortable: true },
];