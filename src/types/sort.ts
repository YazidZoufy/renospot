import type { DpeClass } from '../utils/reno'

export type SortField = 'date' | 'price' | 'pricePerM2' | 'netGain'
export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  field: SortField
  direction: SortDirection
  renoFrom?: DpeClass
  renoTo?: DpeClass
}
