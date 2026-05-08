import { useState, useMemo } from 'react'
import { fetchTransactions } from '../services/dvfApi'
import type { DvfFilters } from '../types/dvf'

const DEFAULT_FILTERS: DvfFilters = {
  arrondissement: '',
  priceMin: '',
  priceMax: '',
  typeLocal: '',
}

const PAGE_SIZE = 50

export function useDvf() {
  const [filters, setFilters] = useState<DvfFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(0)

  const { transactions, total } = useMemo(
    () => fetchTransactions(filters, PAGE_SIZE, page * PAGE_SIZE),
    [filters, page]
  )

  function applyFilters(newFilters: DvfFilters) {
    setPage(0)
    setFilters(newFilters)
  }

  return {
    transactions,
    total,
    loading: false,
    error: null,
    filters,
    page,
    pageSize: PAGE_SIZE,
    applyFilters,
    setPage,
  }
}
