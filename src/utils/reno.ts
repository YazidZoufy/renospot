export type DpeClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

export const DPE_CLASSES: DpeClass[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

// Renovation cost in €/m² to go from class X to class Y (one-way, X > Y in energy efficiency)
// Source: ADEME / industry averages France 2024
const RENO_COST_TABLE: Partial<Record<DpeClass, Partial<Record<DpeClass, number>>>> = {
  G: { F: 110, E: 220, D: 370, C: 520, B: 700, A: 900 },
  F: { E: 130, D: 270, C: 420, B: 600, A: 800 },
  E: { D: 160, C: 310, B: 490, A: 690 },
  D: { C: 190, B: 370, A: 570 },
  C: { B: 210, A: 410 },
  B: { A: 230 },
}

// Price premium vs class D (baseline) in Paris
// Based on Notaires de France / ADEME studies on "valeur verte"
const DPE_PREMIUM: Record<DpeClass, number> = {
  A: 0.18,
  B: 0.12,
  C: 0.06,
  D: 0.00,
  E: -0.05,
  F: -0.10,
  G: -0.16,
}

export function getClassIndex(c: DpeClass): number {
  return DPE_CLASSES.indexOf(c)
}

export function isValidUpgrade(from: DpeClass, to: DpeClass): boolean {
  return getClassIndex(from) > getClassIndex(to)
}

export function getRenoTargets(from: DpeClass): DpeClass[] {
  return DPE_CLASSES.filter(c => isValidUpgrade(from, c))
}

export interface RenoResult {
  renoCost: number
  currentPricePerM2: number
  postRenoValuePerM2: number
  postRenoValue: number
  netGain: number
  roi: number
  paybackYears: number
}

export function calculateRoi(
  from: DpeClass,
  to: DpeClass,
  surface: number,
  currentValue: number
): RenoResult | null {
  if (!isValidUpgrade(from, to)) return null
  const costPerM2 = RENO_COST_TABLE[from]?.[to]
  if (!costPerM2) return null

  const renoCost = costPerM2 * surface
  const currentPricePerM2 = currentValue / surface

  // Apply the delta in DPE premium to the current price/m²
  const premiumDelta = DPE_PREMIUM[to] - DPE_PREMIUM[from]
  const postRenoValuePerM2 = currentPricePerM2 * (1 + premiumDelta)
  const postRenoValue = postRenoValuePerM2 * surface

  const netGain = postRenoValue - currentValue - renoCost
  const roi = (netGain / renoCost) * 100

  // Rough annual energy savings: difference in energy cost between classes
  // ADEME: G ≈ 300€/m²/yr, D ≈ 100€/m²/yr, A ≈ 30€/m²/yr (heating + cooling)
  const energyCostPerM2: Record<DpeClass, number> = {
    A: 30, B: 60, C: 90, D: 120, E: 170, F: 230, G: 300,
  }
  const annualSavings = (energyCostPerM2[from] - energyCostPerM2[to]) * surface
  const paybackYears = annualSavings > 0 ? renoCost / annualSavings : Infinity

  return { renoCost, currentPricePerM2, postRenoValuePerM2, postRenoValue, netGain, roi, paybackYears }
}
