import { useState } from 'react'
import type { DvfTransaction } from '../types/dvf'
import { computeRenoEstimate, DPE_COEFF } from '../utils/reno'
import { ALL_TRANSACTIONS } from '../services/dvfApi'
import type { DpeClass } from '../utils/reno'

interface Props { transaction: DvfTransaction }

const DPE_BG: Record<string, string> = { E:'#F0B40F', F:'#E87A19', G:'#C7251A' }
const DPE_FG: Record<string, string> = { E:'#2A1A00', F:'#fff',    G:'#fff'    }

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

  const dpe = transaction.dpe_classe as DpeClass
  const result = open ? computeRenoEstimate(transaction, ALL_TRANSACTIONS, dpe) : null

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
            Potentiel de rénovation
          </span>
          {/* DPE badge */}
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 4,
            background: DPE_BG[dpe] ?? '#9A9180',
            color: DPE_FG[dpe] ?? '#fff',
          }}>
            {dpe} → D
          </span>
        </div>
        <span style={{ color: 'var(--rs-ink-4)', fontSize: 10,
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 120ms' }}>▼</span>
      </button>

      {open && result && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* DPE info */}
          <div style={{ fontSize: 11, color: 'var(--rs-ink-4)' }}>
            Décote estimée :{' '}
            <span style={{ fontWeight: 600, color: 'var(--rs-danger)' }}>
              {(DPE_COEFF[dpe] * 100).toFixed(0)}%
            </span>
            {' '}vs référence D (Notaires de France)
          </div>

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
          </div>

          {/* Uplift result */}
          <div style={{
            padding: '12px 14px', borderRadius: 12,
            background: 'var(--rs-score-50)',
            border: '1px solid var(--rs-score-100)',
            boxShadow: 'var(--rs-shadow-result)',
          }}>
            <div style={{ fontFamily: 'var(--rs-font-mono)', fontSize: 10, color: 'var(--rs-ink-4)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Potentiel de valorisation
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 3, height: 32, borderRadius: 4, flexShrink: 0,
                background: 'var(--rs-score-500)' }} />
              <div>
                <div style={{ fontFamily: 'var(--rs-font-serif)', fontSize: 20, fontWeight: 500,
                  color: 'var(--rs-score-700)', fontVariantNumeric: 'tabular-nums' }}>
                  +{fmt(result.grossGain)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--rs-ink-4)', marginTop: 2 }}>
                  gain estimé · base prix comparables
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--rs-font-serif)', fontSize: 24, fontWeight: 500,
                  color: 'var(--rs-score-700)' }}>
                  +{result.valueUpliftPct.toFixed(1)}%
                </div>
                <div style={{ fontSize: 10, color: 'var(--rs-ink-4)' }}>vs prix actuel</div>
              </div>
            </div>
            <div style={{ height: 3, background: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99,
                width: `${Math.min(100, result.valueUpliftPct * 5)}%`,
                background: 'var(--rs-score-500)' }} />
            </div>
          </div>

          <div style={{ fontSize: 10, color: 'var(--rs-ink-4)', lineHeight: 1.5 }}>
            Médiane sur {result.comparableCount} ventes ({result.scope === 'local' ? 'même arrondissement' : 'tout Paris'}, ±20% surface, 24 mois) ·
            Coefficients DPE : Notaires de France
          </div>
        </div>
      )}
    </div>
  )
}
