import type { DvfTransaction } from '../types/dvf'
import type { SortConfig } from '../types/sort'
import { computeRenoEstimate } from './reno'
import { ALL_TRANSACTIONS } from '../services/dvfApi'

export function sortTransactions(transactions: DvfTransaction[], sort: SortConfig): DvfTransaction[] {
  const dir = sort.direction === 'asc' ? 1 : -1

  return [...transactions].sort((a, b) => {
    switch (sort.field) {
      case 'date':
        return dir * (a.date_mutation < b.date_mutation ? -1 : 1)

      case 'price':
        return dir * (a.valeur_fonciere - b.valeur_fonciere)

      case 'pricePerM2': {
        const aM2 = a.surface_reelle_bati ? a.valeur_fonciere / a.surface_reelle_bati : -Infinity
        const bM2 = b.surface_reelle_bati ? b.valeur_fonciere / b.surface_reelle_bati : -Infinity
        return dir * (aM2 - bM2)
      }

      case 'uplift': {
        const aUp = a.dpe_classe && a.surface_reelle_bati
          ? (computeRenoEstimate(a, ALL_TRANSACTIONS, a.dpe_classe)?.valueUpliftPct ?? -Infinity)
          : -Infinity
        const bUp = b.dpe_classe && b.surface_reelle_bati
          ? (computeRenoEstimate(b, ALL_TRANSACTIONS, b.dpe_classe)?.valueUpliftPct ?? -Infinity)
          : -Infinity
        return dir * (aUp - bUp)
      }

      default:
        return 0
    }
  })
}
