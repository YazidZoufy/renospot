import type { DvfTransaction } from '../types/dvf'

export type DpeClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
export const DPE_CLASSES: DpeClass[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

// ─── DPE coefficients relative to D (national fallback) ─────────────────────
// Source: Notaires de France "valeur verte" studies + ADEME
// D = référence neutre (0%), décotes pour F/G, primes pour A/B/C
export const DPE_COEFF: Record<DpeClass, number> = {
  A:  0.15,
  B:  0.10,
  C:  0.05,
  D:  0.00,
  E: -0.04,
  F: -0.09,
  G: -0.15,
}

// ─── Renovation cost €/m² from class X → D (ADEME 2024 averages) ────────────
export const RENO_COST_TO_D: Partial<Record<DpeClass, number>> = {
  E: 160,
  F: 270,
  G: 370,
}

// Annual energy cost €/m²/year by class (heating + cooling, ADEME)
const ENERGY_COST_M2: Record<DpeClass, number> = {
  A: 30, B: 60, C: 90, D: 120, E: 170, F: 230, G: 300,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

// ─── Comparable search ───────────────────────────────────────────────────────
function _findComparables(
  t: DvfTransaction,
  all: DvfTransaction[],
  samePostalCode: boolean
): DvfTransaction[] {
  if (!t.surface_reelle_bati) return []
  const surf = t.surface_reelle_bati
  const txDate = new Date(t.date_mutation).getTime()
  const cutoff = txDate - 24 * 30 * 24 * 60 * 60 * 1000 // 24 months ago

  return all.filter(c =>
    c.id !== t.id &&
    c.type_local === t.type_local &&
    c.surface_reelle_bati !== null &&
    c.surface_reelle_bati >= surf * 0.8 &&
    c.surface_reelle_bati <= surf * 1.2 &&
    c.valeur_fonciere > 0 &&
    new Date(c.date_mutation).getTime() >= cutoff &&
    (!samePostalCode || c.code_postal === t.code_postal)
  )
}

export interface ComparablesMeta {
  medianPriceM2: number
  count: number
  scope: 'local' | 'paris'  // local = même arrondissement, paris = tout Paris
}

function getComparablesMeta(
  t: DvfTransaction,
  all: DvfTransaction[]
): ComparablesMeta | null {
  if (!t.surface_reelle_bati) return null

  // Try local first (même code postal)
  let comps = _findComparables(t, all, true)
  let scope: 'local' | 'paris' = 'local'

  // Fallback: all Paris if < 5 local comparables
  if (comps.length < 5) {
    comps = _findComparables(t, all, false)
    scope = 'paris'
  }

  if (comps.length === 0) return null

  const pricesM2 = comps.map(c => c.valeur_fonciere / c.surface_reelle_bati!)
  return { medianPriceM2: median(pricesM2), count: comps.length, scope }
}

// ─── Main estimation ─────────────────────────────────────────────────────────
export interface RenoEstimate {
  // Comparable reference
  medianPriceM2: number
  comparableCount: number
  scope: 'local' | 'paris'

  // Valuation
  currentDpe: DpeClass
  estimatedCurrentValue: number   // médiane × surface × (1 + coeff_dpe)
  postRenoValue: number           // médiane × surface × (1 + 0) → DPE D

  // Result
  grossGain: number               // postReno - currentEstimated
  renoCost: number                // ADEME cost × surface
  netGain: number                 // grossGain - renoCost
  roi: number                     // netGain / renoCost × 100
  paybackYears: number            // renoCost / annual energy savings
}

export function computeRenoEstimate(
  t: DvfTransaction,
  all: DvfTransaction[],
  currentDpe: DpeClass
): RenoEstimate | null {
  if (!t.surface_reelle_bati) return null

  const meta = getComparablesMeta(t, all)
  if (!meta) return null

  const { medianPriceM2, count, scope } = meta
  const surface = t.surface_reelle_bati

  const estimatedCurrentValue = medianPriceM2 * surface * (1 + DPE_COEFF[currentDpe])
  const postRenoValue          = medianPriceM2 * surface // DPE D = coeff 0

  const grossGain  = postRenoValue - estimatedCurrentValue
  const costPerM2  = RENO_COST_TO_D[currentDpe] ?? 0
  const renoCost   = costPerM2 * surface
  const netGain    = grossGain - renoCost
  const roi        = renoCost > 0 ? (netGain / renoCost) * 100 : 0

  const annualSavings = (ENERGY_COST_M2[currentDpe] - ENERGY_COST_M2['D']) * surface
  const paybackYears  = annualSavings > 0 ? renoCost / annualSavings : Infinity

  return {
    medianPriceM2, comparableCount: count, scope,
    currentDpe, estimatedCurrentValue, postRenoValue,
    grossGain, renoCost, netGain, roi, paybackYears,
  }
}

// Keep legacy helper used by sort.ts
export function getRenoTargets(from: DpeClass): DpeClass[] {
  return DPE_CLASSES.filter(c => DPE_CLASSES.indexOf(c) < DPE_CLASSES.indexOf(from))
}

export function isValidUpgrade(from: DpeClass, to: DpeClass): boolean {
  return DPE_CLASSES.indexOf(from) > DPE_CLASSES.indexOf(to)
}

// Legacy calculateRoi kept for sort.ts compatibility
export interface RenoResult {
  renoCost: number; currentPricePerM2: number; postRenoValuePerM2: number
  postRenoValue: number; netGain: number; roi: number; paybackYears: number
}
export function calculateRoi(
  from: DpeClass, to: DpeClass, surface: number, currentValue: number
): RenoResult | null {
  if (!isValidUpgrade(from, to)) return null
  const delta = DPE_COEFF[to] - DPE_COEFF[from]
  const costPerM2 = RENO_COST_TO_D[from] ?? 150
  const renoCost = costPerM2 * surface
  const currentPricePerM2 = currentValue / surface
  const postRenoValuePerM2 = currentPricePerM2 * (1 + delta)
  const postRenoValue = postRenoValuePerM2 * surface
  const netGain = postRenoValue - currentValue - renoCost
  const roi = (netGain / renoCost) * 100
  const annualSavings = (ENERGY_COST_M2[from] - ENERGY_COST_M2[to]) * surface
  const paybackYears = annualSavings > 0 ? renoCost / annualSavings : Infinity
  return { renoCost, currentPricePerM2, postRenoValuePerM2, postRenoValue, netGain, roi, paybackYears }
}
