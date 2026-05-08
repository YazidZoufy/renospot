import { useState } from 'react'
import type { DvfFilters, TypeLocal } from '../types/dvf'

interface Props {
  filters: DvfFilters
  onApply: (filters: DvfFilters) => void
}

const ARRONDISSEMENTS = Array.from({ length: 20 }, (_, i) => String(i + 1))

const TYPE_LOCALS: { label: string; value: TypeLocal; icon: string }[] = [
  { label: 'Appartement', value: 'Appartement', icon: '🏢' },
  { label: 'Maison', value: 'Maison', icon: '🏠' },
  { label: 'Local commercial', value: 'Local industriel. commercial ou assimilé', icon: '🏪' },
  { label: 'Dépendance', value: 'Dépendance', icon: '🏗️' },
]

const EMPTY: DvfFilters = { arrondissement: '', priceMin: '', priceMax: '', typeLocal: '' }

export function FilterSidebar({ filters, onApply }: Props) {
  const [local, setLocal] = useState<DvfFilters>(filters)
  const hasChanges = JSON.stringify(local) !== JSON.stringify(filters)

  function handleReset() {
    setLocal(EMPTY)
    onApply(EMPTY)
  }

  return (
    <aside className="w-64 shrink-0 sticky top-6 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-slate-700">Filtres</h2>
        {(local.arrondissement || local.priceMin !== '' || local.priceMax !== '' || local.typeLocal) && (
          <button onClick={handleReset} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
            Tout effacer
          </button>
        )}
      </div>

      {/* Arrondissement */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Arrondissement</p>
        <div className="grid grid-cols-5 gap-1.5">
          {ARRONDISSEMENTS.map(a => (
            <button
              key={a}
              onClick={() => setLocal(l => ({ ...l, arrondissement: l.arrondissement === a ? '' : a }))}
              className={`h-9 rounded-lg text-xs font-semibold transition-all ${
                local.arrondissement === a
                  ? 'text-white shadow-sm'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
              style={local.arrondissement === a ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Type de bien */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Type de bien</p>
        <div className="space-y-1.5">
          {TYPE_LOCALS.map(t => (
            <button
              key={t.value}
              onClick={() => setLocal(l => ({ ...l, typeLocal: l.typeLocal === t.value ? '' : t.value }))}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                local.typeLocal === t.value
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
              {local.typeLocal === t.value && (
                <span className="ml-auto text-indigo-400 text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Prix (€)</p>
        <div className="space-y-2">
          <div className="relative">
            <input
              type="number"
              placeholder="Minimum"
              value={local.priceMin}
              onChange={e => setLocal(l => ({ ...l, priceMin: e.target.value === '' ? '' : Number(e.target.value) }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-slate-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-300">à</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>
          <input
            type="number"
            placeholder="Maximum"
            value={local.priceMax}
            onChange={e => setLocal(l => ({ ...l, priceMax: e.target.value === '' ? '' : Number(e.target.value) }))}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-slate-300"
          />
        </div>
      </div>

      {/* Apply button */}
      <button
        onClick={() => onApply(local)}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all shadow-sm ${
          hasChanges
            ? 'text-white shadow-indigo-200'
            : 'bg-slate-100 text-slate-400 cursor-default'
        }`}
        style={hasChanges ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}
        disabled={!hasChanges}
      >
        Appliquer les filtres
      </button>
    </aside>
  )
}
