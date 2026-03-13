import type { DashboardStats, TimeSeriesData, DataTableItem, ChartData } from './types'

// Mock data for demonstration
const generateTimeSeriesData = (days: number): TimeSeriesData[] => {
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    value: Math.floor(Math.random() * 1000) + 500,
    users: Math.floor(Math.random() * 500) + 100,
    conversations: Math.floor(Math.random() * 800) + 300,
    tokens: Math.floor(Math.random() * 50000) + 20000,
  }))
}

const generateTableData = (): DataTableItem[] => {
  const statuses: Array<'active' | 'inactive' | 'pending'> = ['active', 'inactive', 'pending']
  const agents = ['Agent 1', 'Agent 2', 'Agent 3', 'Agent 4', 'Agent 5']

  return Array.from({ length: 50 }, (_, i) => ({
    id: `user-${i + 1}`,
    user: `Usuário ${i + 1}`,
    email: `usuario${i + 1}@exemplo.com`,
    agent: agents[i % agents.length],
    status: statuses[i % statuses.length],
    lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
    tokens: Math.floor(Math.random() * 10000),
  }))
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    await new Promise(resolve => setTimeout(resolve, 800))
    return {
      totalUsers: 12543,
      totalAgents: 47,
      totalConversations: 89342,
      totalTokens: 2456789,
      activeUsers: 3241,
      avgSessionDuration: 15.2,
      conversionRate: 23.4,
    }
  },

  getTimeSeriesData: async (range: '7d' | '30d' | '90d' | '1y'): Promise<TimeSeriesData[]> => {
    await new Promise(resolve => setTimeout(resolve, 600))
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365
    return generateTimeSeriesData(days)
  },

  getAgentDistribution: async (): Promise<ChartData[]> => {
    await new Promise(resolve => setTimeout(resolve, 400))
    return [
      { name: 'Suporte Técnico', value: 34, fill: '#6366f1' },
      { name: 'Vendas', value: 25, fill: '#0ea5e9' },
      { name: 'Atendimento', value: 18, fill: '#10b981' },
      { name: 'Financeiro', value: 15, fill: '#f59e0b' },
      { name: 'Jurídico', value: 8, fill: '#ef4444' },
    ]
  },

  getActivityByHour: async (): Promise<ChartData[]> => {
    await new Promise(resolve => setTimeout(resolve, 400))
    return Array.from({ length: 24 }, (_, i) => ({
      name: `${i.toString().padStart(2, '0')}:00`,
      value: Math.floor(Math.random() * 100) + 20,
      fill: i >= 9 && i <= 18 ? '#6366f1' : '#8b5cf6',
    }))
  },

  getTableData: async (): Promise<DataTableItem[]> => {
    await new Promise(resolve => setTimeout(resolve, 700))
    return generateTableData()
  },

  getTopAgents: async (): Promise<ChartData[]> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return [
      { name: 'Agente Alpha', value: 45234, fill: '#0ea5e9' },
      { name: 'Agente Beta', value: 38765, fill: '#6366f1' },
      { name: 'Agente Gamma', value: 29543, fill: '#10b981' },
      { name: 'Agente Delta', value: 21234, fill: '#f59e0b' },
    ]
  },
}
