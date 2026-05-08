import type { DvfTransaction } from '../types/dvf'
import type { SortConfig } from '../types/sort'
import { calculateRoi } from './reno'

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

      case 'netGain': {
        const from = sort.renoFrom ?? 'G'
        const to = sort.renoTo ?? 'D'
        const aGain = a.surface_reelle_bati
          ? (calculateRoi(from, to, a.surface_reelle_bati, a.valeur_fonciere)?.netGain ?? -Infinity)
          : -Infinity
        const bGain = b.surface_reelle_bati
          ? (calculateRoi(from, to, b.surface_reelle_bati, b.valeur_fonciere)?.netGain ?? -Infinity)
          : -Infinity
        return dir * (aGain - bGain)
      }

      default:
        return 0
    }
  })
}
