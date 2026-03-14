export const mockDashboardStats = {
  totalUsers: 1234,
  totalAgents: 56,
  totalConversations: 7890,
  totalTokens: 123456,
};

export const mockTimeSeriesData = [
  { date: '2024-01-01', value: 100 },
  { date: '2024-01-02', value: 150 },
  { date: '2024-01-03', value: 200 },
];

export const mockAgentDistribution = [
  { name: 'Agent A', value: 400, fill: '#6366f1' },
  { name: 'Agent B', value: 300, fill: '#0ea5e9' },
  { name: 'Agent C', value: 300, fill: '#10b981' },
];

export const mockActivityByHour = [
  { name: '00h', value: 20 },
  { name: '06h', value: 50 },
  { name: '12h', value: 80 },
  { name: '18h', value: 60 },
];

export const mockTopAgents = [
  { name: 'Support Bot', value: 150 },
  { name: 'Sales Bot', value: 120 },
];

export const mockTableData = [
  {
    id: '1',
    user: 'John Doe',
    email: 'john@example.com',
    agent: 'Support Bot',
    status: 'active',
    lastActivity: '2024-01-15 10:30',
    tokens: 1500,
  },
  {
    id: '2',
    user: 'Jane Smith',
    email: 'jane@example.com',
    agent: 'Sales Bot',
    status: 'inactive',
    lastActivity: '2024-01-14 15:45',
    tokens: 800,
  },
];
