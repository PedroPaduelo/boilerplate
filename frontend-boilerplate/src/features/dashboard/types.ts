export interface DashboardStats {
  totalUsers: number
  totalAgents: number
  totalConversations: number
  totalTokens: number
  activeUsers: number
  avgSessionDuration: number
  conversionRate: number
}

export interface TimeSeriesData {
  date: string
  value: number
  users?: number
  conversations?: number
  tokens?: number
}

export interface ChartData {
  name: string
  value: number
  fill?: string
}

export interface DataTableItem {
  id: string
  user: string
  email: string
  agent: string
  status: 'active' | 'inactive' | 'pending'
  lastActivity: string
  tokens: number
}

export interface FilterOptions {
  dateRange: '7d' | '30d' | '90d' | '1y'
  status: string[]
  agent?: string
  search?: string
}
