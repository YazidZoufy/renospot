import { useState } from 'react'
import type { DvfFilters, TypeLocal } from '../types/dvf'

interface Props {
  filters: DvfFilters
  onApply: (filters: DvfFilters) => void
}

const ARRONDISSEMENTS = Array.from({ length: 20 }, (_, i) => String(i + 1))

const TYPE_LOCALS: { label: string; value: TypeLocal }[] = [
  { label: 'Appartement', value: 'Appartement' },
  { label: 'Maison', value: 'Maison' },
  { label: 'Local commercial', value: 'Local industriel. commercial ou assimilé' },
  { label: 'Dépendance', value: 'Dépendance' },
]

const EMPTY: DvfFilters = { arrondissement: '', priceMin: '', priceMax: '', typeLocal: '' }

const label = (text: string) => (
  <div style={{ fontFamily: 'var(--rs-font-mono)', fontSize: 10, color: 'var(--rs-ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
    {text}
  </div>
)

export function FilterSidebar({ filters, onApply }: Props) {
  const [local, setLocal] = useState<DvfFilters>(filters)
  const hasChanges = JSON.stringify(local) !== JSON.stringify(filters)
  const hasAny = !!(local.arrondissement || local.priceMin !== '' || local.priceMax !== '' || local.typeLocal)

  function handleReset() {
    setLocal(EMPTY)
    onApply(EMPTY)
  }

  return (
    <aside style={{ width: 240, flexShrink: 0, position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
        <span style={{ fontFamily: 'var(--rs-font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--rs-ink-2)' }}>Filtres</span>
        {hasAny && (
          <button onClick={handleReset} style={{ fontFamily: 'var(--rs-font-sans)', fontSize: 12, color: 'var(--rs-brand-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            Tout effacer
          </button>
        )}
      </div>

      {/* Arrondissement */}
      <div style={{ background: 'var(--rs-card)', border: '1px solid var(--rs-ledger)', borderRadius: 'var(--rs-r-lg)', padding: '16px' }}>
        {label('Arrondissement')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5 }}>
          {ARRONDISSEMENTS.map(a => {
            const active = local.arrondissement === a
            return (
              <button key={a} onClick={() => setLocal(l => ({ ...l, arrondissement: l.arrondissement === a ? '' : a }))}
                style={{
                  height: 34, borderRadius: 'var(--rs-r-sm)', border: active ? '1px solid var(--rs-brand-300)' : '1px solid var(--rs-ledger)',
                  background: active ? 'var(--rs-brand-600)' : 'var(--rs-paper)',
                  color: active ? '#fff' : 'var(--rs-ink-3)',
                  fontSize: 12, fontWeight: active ? 600 : 400,
                  fontFamily: 'var(--rs-font-sans)', cursor: 'pointer',
                  transition: 'all var(--rs-dur-fast) var(--rs-ease-out)',
                }}>
                {a}
              </button>
            )
          })}
        </div>
      </div>

      {/* Type de bien */}
      <div style={{ background: 'var(--rs-card)', border: '1px solid var(--rs-ledger)', borderRadius: 'var(--rs-r-lg)', padding: '16px' }}>
        {label('Type de bien')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[{ label: 'Tous types', value: '' as TypeLocal | '' }, ...TYPE_LOCALS].map(t => {
            const active = local.typeLocal === t.value
            return (
              <button key={t.value} onClick={() => setLocal(l => ({ ...l, typeLocal: active ? '' : t.value }))}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', borderRadius: 'var(--rs-r-sm)',
                  border: active ? '1px solid var(--rs-score-400)' : '1px solid transparent',
                  background: active ? 'var(--rs-score-tint)' : 'transparent',
                  color: active ? 'var(--rs-score-700)' : 'var(--rs-ink-2)',
                  fontSize: 13, fontWeight: active ? 500 : 400,
                  fontFamily: 'var(--rs-font-sans)', cursor: 'pointer', textAlign: 'left',
                  transition: 'all var(--rs-dur-fast) var(--rs-ease-out)',
                }}>
                {t.label}
                {active && <span style={{ fontSize: 10 }}>✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Prix */}
      <div style={{ background: 'var(--rs-card)', border: '1px solid var(--rs-ledger)', borderRadius: 'var(--rs-r-lg)', padding: '16px' }}>
        {label('Prix (€)')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input type="number" placeholder="Minimum"
            value={local.priceMin}
            onChange={e => setLocal(l => ({ ...l, priceMin: e.target.value === '' ? '' : Number(e.target.value) }))}
            style={{
              width: '100%', background: 'var(--rs-paper)', border: '1px solid var(--rs-ledger-strong)',
              borderRadius: 'var(--rs-r-md)', padding: '9px 12px',
              fontFamily: 'var(--rs-font-sans)', fontSize: 14, color: 'var(--rs-ink)',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--rs-ledger)' }} />
            <span style={{ fontSize: 11, color: 'var(--rs-ink-4)' }}>à</span>
            <div style={{ flex: 1, height: 1, background: 'var(--rs-ledger)' }} />
          </div>
          <input type="number" placeholder="Maximum"
            value={local.priceMax}
            onChange={e => setLocal(l => ({ ...l, priceMax: e.target.value === '' ? '' : Number(e.target.value) }))}
            style={{
              width: '100%', background: 'var(--rs-paper)', border: '1px solid var(--rs-ledger-strong)',
              borderRadius: 'var(--rs-r-md)', padding: '9px 12px',
              fontFamily: 'var(--rs-font-sans)', fontSize: 14, color: 'var(--rs-ink)',
            }}
          />
        </div>
      </div>

      {/* Apply */}
      <button onClick={() => onApply(local)} disabled={!hasChanges}
        style={{
          width: '100%', padding: '11px 16px', borderRadius: 'var(--rs-r-md)', border: 'none', cursor: hasChanges ? 'pointer' : 'default',
          fontFamily: 'var(--rs-font-sans)', fontSize: 14, fontWeight: 500,
          background: hasChanges ? 'var(--rs-brand-600)' : 'var(--rs-paper-2)',
          color: hasChanges ? '#fff' : 'var(--rs-ink-4)',
          transition: 'all var(--rs-dur-fast) var(--rs-ease-out)',
        }}>
        Appliquer les filtres
      </button>
    </aside>
  )
}
