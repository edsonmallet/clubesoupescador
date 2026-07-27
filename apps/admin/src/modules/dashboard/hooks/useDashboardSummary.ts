'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboard.service'

export function useDashboardSummary() {
  const subscriptions = useQuery({
    queryKey: ['dashboard-subscriptions-summary'],
    queryFn: () => dashboardService.getSubscriptionsSummary(),
  })
  const store = useQuery({
    queryKey: ['dashboard-store-summary'],
    queryFn: () => dashboardService.getStoreSummary(),
  })
  const cashback = useQuery({
    queryKey: ['dashboard-cashback-summary'],
    queryFn: () => dashboardService.getCashbackSummary(),
  })

  return {
    subscriptions,
    store,
    cashback,
    isLoading: subscriptions.isLoading || store.isLoading || cashback.isLoading,
  }
}
