import type { SortConfig, SortField } from '../types/sort'

interface Props { sort: SortConfig; onChange: (s: SortConfig) => void }

const OPTIONS: { label: string; field: SortField }[] = [
  { label: 'Date',         field: 'date'       },
  { label: 'Prix',         field: 'price'      },
  { label: 'Prix/m²',     field: 'pricePerM2' },
  { label: '% valorisation', field: 'uplift'  },
]

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
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--rs-ink-4)', fontWeight: 500 }}>Trier par</span>
        {OPTIONS.map(o => (
          <Chip key={o.field} active={sort.field === o.field} onClick={() => toggle(o.field)}>
            {o.label}
            {sort.field === o.field && <span style={{ opacity: 0.6 }}>{sort.direction === 'desc' ? '↓' : '↑'}</span>}
          </Chip>
        ))}
      </div>
    </div>
  )
}
