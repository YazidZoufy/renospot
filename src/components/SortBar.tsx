import type { SortConfig, SortField } from '../types/sort'
import type { DpeClass } from '../utils/reno'
import { DPE_CLASSES } from '../utils/reno'

interface Props {
  sort: SortConfig
  onChange: (sort: SortConfig) => void
}

const SORT_OPTIONS: { label: string; field: SortField; icon: string }[] = [
  { label: 'Date',       field: 'date',       icon: '📅' },
  { label: 'Prix',       field: 'price',      icon: '💶' },
  { label: 'Prix/m²',   field: 'pricePerM2', icon: '📐' },
  { label: 'Plus-value', field: 'netGain',    icon: '🚀' },
]

const DPE_BG: Record<DpeClass, string> = {
  A: '#16a34a', B: '#4ade80', C: '#a3e635',
  D: '#facc15', E: '#fb923c', F: '#ea580c', G: '#dc2626',
}
const DPE_TEXT: Record<DpeClass, string> = {
  A: '#fff', B: '#14532d', C: '#365314',
  D: '#713f12', E: '#fff', F: '#fff', G: '#fff',
}

export function SortBar({ sort, onChange }: Props) {
  function toggleField(field: SortField) {
    if (sort.field === field) {
      onChange({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' })
    } else {
      onChange({ field, direction: 'desc', renoFrom: sort.renoFrom ?? 'G', renoTo: sort.renoTo ?? 'D' })
    }
  }

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium mr-1">Trier par</span>
        {SORT_OPTIONS.map(opt => {
          const active = sort.field === opt.field
          return (
            <button
              key={opt.field}
              onClick={() => toggleField(opt.field)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? 'text-white shadow-sm shadow-indigo-200'
                  : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-500'
              }`}
              style={active ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}
            >
              <span>{opt.icon}</span>
              {opt.label}
              {active && (
                <span className="opacity-80 text-[10px]">{sort.direction === 'desc' ? '↓' : '↑'}</span>
              )}
            </button>
          )
        })}
      </div>

      {sort.field === 'netGain' && (
        <div className="flex flex-wrap items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <span className="text-xs font-semibold text-amber-700">Scénario :</span>

          <div className="flex items-center gap-1">
            {(['G', 'F', 'E', 'D', 'C', 'B'] as DpeClass[]).map(c => (
              <button
                key={c}
                onClick={() => onChange({ ...sort, renoFrom: c })}
                className={`w-6 h-6 rounded text-[11px] font-black transition-all ${
                  sort.renoFrom === c ? 'ring-2 ring-offset-1 ring-amber-500 scale-110' : 'opacity-60 hover:opacity-90'
                }`}
                style={{ background: DPE_BG[c], color: DPE_TEXT[c] }}
              >
                {c}
              </button>
            ))}
          </div>

          <span className="text-amber-300 text-sm">→</span>

          <div className="flex items-center gap-1">
            {(['E', 'D', 'C', 'B', 'A'] as DpeClass[]).map(c => {
              const fromIdx = DPE_CLASSES.indexOf(sort.renoFrom ?? 'G')
              const toIdx = DPE_CLASSES.indexOf(c)
              const valid = toIdx < fromIdx
              return (
                <button
                  key={c}
                  disabled={!valid}
                  onClick={() => valid && onChange({ ...sort, renoTo: c })}
                  className={`w-6 h-6 rounded text-[11px] font-black transition-all ${
                    !valid
                      ? 'cursor-not-allowed opacity-15'
                      : sort.renoTo === c
                      ? 'ring-2 ring-offset-1 ring-amber-500 scale-110'
                      : 'opacity-60 hover:opacity-90'
                  }`}
                  style={valid ? { background: DPE_BG[c], color: DPE_TEXT[c] } : { background: '#e2e8f0', color: '#cbd5e1' }}
                >
                  {c}
                </button>
              )
            })}
          </div>

          <span className="text-xs text-amber-500 font-medium ml-auto">
            {sort.renoFrom ?? 'G'} → {sort.renoTo ?? 'D'}
          </span>
        </div>
      )}
    </div>
  )
}
