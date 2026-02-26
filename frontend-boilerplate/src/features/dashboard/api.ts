import { apiClient } from '@/shared/lib/api-client'
import type { DashboardStats } from './types'

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get('/dashboard/stats')
    return data
  },
}
