import { useState } from 'react'
import type { DvfTransaction } from '../types/dvf'
import { RenoCalculator } from './RenoCalculator'

interface Props { transaction: DvfTransaction }

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  'Appartement':                                    { label: 'Appartement',      color: 'var(--rs-brand-600)' },
  'Maison':                                         { label: 'Maison',           color: '#2A6FB5' },
  'Local industriel. commercial ou assimilé':       { label: 'Local commercial', color: 'var(--rs-warn)' },
  'Dépendance':                                     { label: 'Dépendance',       color: 'var(--rs-ink-3)' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}
function fmtDate(d: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d))
}

export function TransactionCard({ transaction: t }: Props) {
  const [hovered, setHovered] = useState(false)
  const cfg = TYPE_CONFIG[t.type_local] ?? TYPE_CONFIG['Dépendance']
  const hasSurface = !!t.surface_reelle_bati && t.surface_reelle_bati > 0
  const ppm2 = hasSurface ? Math.round(t.valeur_fonciere / t.surface_reelle_bati!) : null

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--rs-card)',
        border: '1px solid var(--rs-ledger)',
        borderRadius: 'var(--rs-r-lg)',
        boxShadow: hovered ? 'var(--rs-shadow-lg)' : 'var(--rs-shadow-md)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        transition: 'box-shadow var(--rs-dur-base) var(--rs-ease-out)',
      }}
    >
      {/* Top row: type chip + date */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 'var(--rs-r-pill)',
          background: 'var(--rs-paper-2)', border: '1px solid var(--rs-ledger)',
          fontSize: 11, fontWeight: 500, color: cfg.color,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
          {cfg.label}
        </span>
        <span style={{ fontFamily: 'var(--rs-font-mono)', fontSize: 11, color: 'var(--rs-ink-4)' }}>
          {fmtDate(t.date_mutation)}
        </span>
      </div>

      {/* Address */}
      <div style={{ marginBottom: 14 }}>
        <div style={{
          fontFamily: 'var(--rs-font-serif)', fontSize: 17, fontWeight: 500,
          letterSpacing: '-0.01em', color: 'var(--rs-ink)', lineHeight: 1.25,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {t.adresse_numero ? `${t.adresse_numero} ` : ''}{t.adresse_nom_voie || '—'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--rs-ink-3)', marginTop: 3 }}>{t.com_name}</div>
      </div>

      {/* Price row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            fontFamily: 'var(--rs-font-serif)', fontSize: 28, fontWeight: 500,
            letterSpacing: '-0.02em', color: 'var(--rs-ink)', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {fmt(t.valeur_fonciere)}
          </div>
          {ppm2 && (
            <div style={{ fontSize: 12, color: 'var(--rs-ink-4)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
              {ppm2.toLocaleString('fr-FR')} €/m²
            </div>
          )}
        </div>

        {t.surface_reelle_bati && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--rs-font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--rs-ink-2)' }}>
              {t.surface_reelle_bati} m²
            </div>
            {t.nombre_pieces_principales ? (
              <div style={{ fontSize: 12, color: 'var(--rs-ink-4)', marginTop: 2 }}>
                {t.nombre_pieces_principales} pièce{t.nombre_pieces_principales > 1 ? 's' : ''}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--rs-ledger)', margin: '14px 0' }} />

      {/* ROI */}
      {hasSurface
        ? <RenoCalculator transaction={t} />
        : <div style={{ fontSize: 11, color: 'var(--rs-ink-4)', fontStyle: 'italic' }}>Surface non renseignée — ROI indisponible</div>
      }
    </div>
  )
}
