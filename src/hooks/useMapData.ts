import { useMemo } from 'react'
import { fetchTransactionsForMap } from '../services/dvfApi'
import type { DvfFilters } from '../types/dvf'

export function useMapData(filters: DvfFilters) {
  const { transactions, total } = useMemo(
    () => fetchTransactionsForMap(filters),
    [filters]
  )

  return {
    transactions,
    total,
    loaded: transactions.length,
    loading: false,
    error: null,
  }
}
