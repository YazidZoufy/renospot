import type { SortConfig, SortField } from '../types/sort'
import type { DpeClass } from '../utils/reno'
import { DPE_CLASSES } from '../utils/reno'

interface Props { sort: SortConfig; onChange: (s: SortConfig) => void }

const OPTIONS: { label: string; field: SortField }[] = [
  { label: 'Date',       field: 'date'       },
  { label: 'Prix',       field: 'price'      },
  { label: 'Prix/m²',   field: 'pricePerM2' },
  { label: '+ value',   field: 'netGain'    },
]

const DPE_BG: Record<DpeClass, string> = { A:'#319B42', B:'#5BB660', C:'#B7CD3D', D:'#F4E70F', E:'#F0B40F', F:'#E87A19', G:'#C7251A' }
const DPE_FG: Record<DpeClass, string> = { A:'#fff',    B:'#0B2A12', C:'#1A2200', D:'#2A2300', E:'#2A1A00', F:'#fff',    G:'#fff'    }

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 12px', borderRadius: 'var(--rs-r-pill)', border: '1px solid',
      borderColor: active ? 'var(--rs-score-500)' : 'var(--rs-ledger)',
      background: active ? 'var(--rs-score-tint)' : 'var(--rs-card)',
      color: active ? 'var(--rs-score-700)' : 'var(--rs-ink-2)',
      fontSize: 12, fontWeight: active ? 600 : 400,
      fontFamily: 'var(--rs-font-sans)', cursor: 'pointer',
      transition: 'all var(--rs-dur-fast) var(--rs-ease-out)',
    }}>
      {children}
    </button>
  )
}

export function SortBar({ sort, onChange }: Props) {
  function toggle(field: SortField) {
    onChange(sort.field === field
      ? { ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' }
      : { ...sort, field, direction: 'desc' })
  }

  return (
    <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--rs-ink-4)', fontWeight: 500 }}>Trier par</span>
        {OPTIONS.map(o => (
          <Chip key={o.field} active={sort.field === o.field} onClick={() => toggle(o.field)}>
            {o.label}
            {sort.field === o.field && <span style={{ opacity: 0.6 }}>{sort.direction === 'desc' ? '↓' : '↑'}</span>}
          </Chip>
        ))}
      </div>

      {sort.field === 'netGain' && (
        <div style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10,
          background: 'var(--rs-warn-bg)', border: '1px solid #F0E2A6',
          borderRadius: 'var(--rs-r-md)', padding: '8px 14px',
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--rs-warn-fg)' }}>Scénario :</span>

          <div style={{ display: 'flex', gap: 4 }}>
            {(['G','F','E','D'] as DpeClass[]).map(c => (
              <button key={c} onClick={() => onChange({ ...sort, renoFrom: c })}
                style={{ width: 24, height: 24, borderRadius: 4, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 11,
                  background: DPE_BG[c], color: DPE_FG[c],
                  outline: sort.renoFrom === c ? '2px solid var(--rs-ink)' : 'none', outlineOffset: 2,
                }}>{c}</button>
            ))}
          </div>

          <span style={{ color: 'var(--rs-ledger-strong)' }}>→</span>

          <div style={{ display: 'flex', gap: 4 }}>
            {(['C','D','B','A'] as DpeClass[]).map(c => {
              const valid = DPE_CLASSES.indexOf(c) < DPE_CLASSES.indexOf(sort.renoFrom ?? 'G')
              return (
                <button key={c} disabled={!valid} onClick={() => valid && onChange({ ...sort, renoTo: c })}
                  style={{ width: 24, height: 24, borderRadius: 4, border: 'none', fontWeight: 700, fontSize: 11,
                    background: valid ? DPE_BG[c] : '#E8E2D6', color: valid ? DPE_FG[c] : '#9A9180',
                    cursor: valid ? 'pointer' : 'not-allowed', opacity: valid ? 1 : 0.5,
                    outline: sort.renoTo === c && valid ? '2px solid var(--rs-ink)' : 'none', outlineOffset: 2,
                  }}>{c}</button>
              )
            })}
          </div>

          <span style={{ fontSize: 11, color: 'var(--rs-warn-fg)', fontWeight: 600, marginLeft: 'auto' }}>
            {sort.renoFrom ?? 'G'} → {sort.renoTo ?? 'D'}
          </span>
        </div>
      )}
    </div>
  )
}
