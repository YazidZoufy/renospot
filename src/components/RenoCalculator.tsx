import { useState } from 'react'
import type { DvfTransaction } from '../types/dvf'
import { computeRenoEstimate, DPE_CLASSES, DPE_COEFF, type DpeClass } from '../utils/reno'
import { ALL_TRANSACTIONS } from '../services/dvfApi'

interface Props { transaction: DvfTransaction }

const DPE_BG: Record<DpeClass, string> = { A:'#319B42', B:'#5BB660', C:'#B7CD3D', D:'#F4E70F', E:'#F0B40F', F:'#E87A19', G:'#C7251A' }
const DPE_FG: Record<DpeClass, string> = { A:'#fff',    B:'#0B2A12', C:'#1A2200', D:'#2A2300', E:'#2A1A00', F:'#fff',    G:'#fff'    }

const NEEDS_RENO: DpeClass[] = ['E', 'F', 'G']

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}
function fmtM2(n: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' €/m²'
}

function Row({ label, value, accent, small }: { label: string; value: string; accent?: string; small?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: small ? 11 : 12, color: 'var(--rs-ink-4)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--rs-font-serif)', fontSize: small ? 13 : 15, fontWeight: 500,
        fontVariantNumeric: 'tabular-nums', color: accent ?? 'var(--rs-ink)' }}>
        {value}
      </span>
    </div>
  )
}

export function RenoCalculator({ transaction }: Props) {
  const [open, setOpen] = useState(false)
  const [dpe, setDpe] = useState<DpeClass>('F')

  const result = open && transaction.surface_reelle_bati
    ? computeRenoEstimate(transaction, ALL_TRANSACTIONS, dpe)
    : null

  const needsReno = NEEDS_RENO.includes(dpe)

  return (
    <div>
      {/* Trigger */}
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--rs-score-tint)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🔧</div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--rs-brand-600)', fontFamily: 'var(--rs-font-sans)' }}>
            Estimer le potentiel de rénovation
          </span>
        </div>
        <span style={{ color: 'var(--rs-ink-4)', fontSize: 10,
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 120ms' }}>▼</span>
      </button>

      {open && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* DPE selector — current class only, target = D */}
          <div>
            <div style={{ fontFamily: 'var(--rs-font-mono)', fontSize: 10, color: 'var(--rs-ink-4)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Classe DPE actuelle du bien
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {DPE_CLASSES.map(c => (
                  <button key={c} onClick={() => setDpe(c)} style={{
                    width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: 13, fontFamily: 'var(--rs-font-sans)',
                    background: DPE_BG[c], color: DPE_FG[c],
                    opacity: dpe === c ? 1 : 0.35,
                    transform: dpe === c ? 'scale(1.12)' : 'scale(1)',
                    outline: dpe === c ? '2px solid var(--rs-ink)' : 'none', outlineOffset: 2,
                    transition: 'all 120ms',
                  }}>{c}</button>
                ))}
              </div>
              <span style={{ fontSize: 11, color: 'var(--rs-ink-4)', marginLeft: 4 }}>→ objectif D</span>
            </div>

            {/* DPE coeff hint */}
            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--rs-ink-4)' }}>
              Décote estimée :{' '}
              <span style={{ fontWeight: 600, color: DPE_COEFF[dpe] < 0 ? 'var(--rs-danger)' : 'var(--rs-success-fg)' }}>
                {DPE_COEFF[dpe] >= 0 ? '+' : ''}{(DPE_COEFF[dpe] * 100).toFixed(0)}%
              </span>
              {' '}vs référence D
            </div>
          </div>

          {/* No reno needed if D or better */}
          {!needsReno && (
            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--rs-score-50)',
              border: '1px solid var(--rs-score-100)', fontSize: 12, color: 'var(--rs-score-700)' }}>
              ✓ Ce bien est déjà en classe {dpe} — au-dessus de la référence D, aucune rénovation requise.
            </div>
          )}

          {/* Results */}
          {needsReno && result && (
            <>
              {/* Comparables info */}
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--rs-paper)',
                border: '1px solid var(--rs-ledger)', display: 'flex', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--rs-ink-4)', marginBottom: 2 }}>Médiane de référence</div>
                  <div style={{ fontFamily: 'var(--rs-font-serif)', fontSize: 16, fontWeight: 500,
                    color: 'var(--rs-ink)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtM2(result.medianPriceM2)}
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid var(--rs-ledger)', paddingLeft: 16 }}>
                  <div style={{ fontSize: 10, color: 'var(--rs-ink-4)', marginBottom: 2 }}>Basé sur</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--rs-ink-2)' }}>
                    {result.comparableCount} vente{result.comparableCount > 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--rs-ink-4)' }}>
                    {result.scope === 'local' ? 'même arrondissement' : 'tout Paris'} · ±20% surface · 24 mois
                  </div>
                </div>
              </div>

              {/* Valuation table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6,
                padding: '12px', borderRadius: 10, background: 'var(--rs-paper)',
                border: '1px solid var(--rs-ledger)' }}>
                <Row label={`Valeur estimée actuelle (DPE ${dpe})`} value={fmt(result.estimatedCurrentValue)} />
                <div style={{ height: 1, background: 'var(--rs-ledger)', margin: '2px 0' }} />
                <Row label="Valeur après rénovation (DPE D)" value={fmt(result.postRenoValue)}
                  accent="var(--rs-brand-600)" />
                <div style={{ height: 1, background: 'var(--rs-ledger)', margin: '2px 0' }} />
                <Row label="Gain brut de valorisation" value={(result.grossGain >= 0 ? '+' : '') + fmt(result.grossGain)}
                  accent={result.grossGain >= 0 ? 'var(--rs-success-fg)' : 'var(--rs-danger-fg)'} />
                <Row label="Coût travaux estimé (ADEME)" value={'− ' + fmt(result.renoCost)} small />
              </div>

              {/* ROI result */}
              <div style={{
                padding: '12px 14px', borderRadius: 12,
                background: result.netGain >= 0 ? 'var(--rs-score-50)' : 'var(--rs-danger-bg)',
                border: `1px solid ${result.netGain >= 0 ? 'var(--rs-score-100)' : 'rgba(199,37,26,0.2)'}`,
                boxShadow: result.netGain >= 0 ? 'var(--rs-shadow-result)' : 'none',
              }}>
                <div style={{ fontFamily: 'var(--rs-font-mono)', fontSize: 10, color: 'var(--rs-ink-4)',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  ROI net après travaux
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 3, height: 32, borderRadius: 4, flexShrink: 0,
                    background: result.netGain >= 0 ? 'var(--rs-score-500)' : 'var(--rs-danger)' }} />
                  <div>
                    <div style={{ fontFamily: 'var(--rs-font-serif)', fontSize: 20, fontWeight: 500,
                      color: result.netGain >= 0 ? 'var(--rs-score-700)' : 'var(--rs-danger-fg)',
                      fontVariantNumeric: 'tabular-nums' }}>
                      {result.netGain >= 0 ? '+' : ''}{fmt(result.netGain)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--rs-ink-4)', marginTop: 2 }}>
                      plus-value nette · retour invest. {result.paybackYears === Infinity ? '—' : result.paybackYears.toFixed(1) + ' ans'}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--rs-font-serif)', fontSize: 24, fontWeight: 500,
                      color: result.roi >= 0 ? 'var(--rs-score-700)' : 'var(--rs-danger-fg)' }}>
                      {result.roi >= 0 ? '+' : ''}{result.roi.toFixed(0)}%
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--rs-ink-4)' }}>ROI</div>
                  </div>
                </div>
                {/* ROI bar */}
                <div style={{ height: 3, background: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99,
                    width: `${Math.max(0, Math.min(100, ((result.roi + 100) / 300) * 100))}%`,
                    background: result.netGain >= 0 ? 'var(--rs-score-500)' : 'var(--rs-danger)' }} />
                </div>
              </div>

              <div style={{ fontSize: 10, color: 'var(--rs-ink-4)', lineHeight: 1.5 }}>
                Médiane calculée sur {result.comparableCount} ventes comparables ({result.scope === 'local' ? 'même arrondissement' : 'tout Paris'}, ±20% surface, 24 mois) ·
                Coefficients DPE : Notaires de France · Coûts travaux : ADEME 2024
              </div>
            </>
          )}

          {/* No comparables found */}
          {needsReno && !result && (
            <div style={{ fontSize: 12, color: 'var(--rs-ink-4)', fontStyle: 'italic',
              padding: '8px 12px', background: 'var(--rs-paper)', borderRadius: 8,
              border: '1px solid var(--rs-ledger)' }}>
              Pas assez de comparables pour calculer une estimation fiable.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
