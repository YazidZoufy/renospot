import rawData from '../data/dvf-paris.json'
import type { DvfFilters, DvfTransaction } from '../types/dvf'

const ALL_TRANSACTIONS: DvfTransaction[] = rawData as DvfTransaction[]

function applyFilters(data: DvfTransaction[], filters: DvfFilters): DvfTransaction[] {
  return data.filter(t => {
    if (filters.arrondissement) {
      const cp = `750${filters.arrondissement.padStart(2, '0')}`
      if (t.code_postal !== cp) return false
    }
    if (filters.priceMin !== '' && t.valeur_fonciere < filters.priceMin) return false
    if (filters.priceMax !== '' && t.valeur_fonciere > filters.priceMax) return false
    if (filters.typeLocal && t.type_local !== filters.typeLocal) return false
    return true
  })
}

export function fetchTransactions(
  filters: DvfFilters,
  limit = 50,
  offset = 0
): { transactions: DvfTransaction[]; total: number } {
  const filtered = applyFilters(ALL_TRANSACTIONS, filters)
  return {
    transactions: filtered.slice(offset, offset + limit),
    total: filtered.length,
  }
}

export function fetchTransactionsForMap(filters: DvfFilters): { transactions: DvfTransaction[]; total: number } {
  const filtered = applyFilters(ALL_TRANSACTIONS, filters)
  return { transactions: filtered, total: filtered.length }
}
