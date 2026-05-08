import { useState } from 'react'
import { DPE_CLASSES, calculateRoi, getRenoTargets, type DpeClass } from '../utils/reno'

interface Props {
  surface: number
  currentValue: number
}

const DPE_STYLE: Record<DpeClass, { bg: string; text: string; label: string }> = {
  A: { bg: '#16a34a', text: '#fff',     label: 'Très économe' },
  B: { bg: '#4ade80', text: '#14532d',  label: 'Économe' },
  C: { bg: '#a3e635', text: '#365314',  label: 'Assez économe' },
  D: { bg: '#facc15', text: '#713f12',  label: 'Moyen' },
  E: { bg: '#fb923c', text: '#fff',     label: 'Assez énergivore' },
  F: { bg: '#ea580c', text: '#fff',     label: 'Énergivore' },
  G: { bg: '#dc2626', text: '#fff',     label: 'Très énergivore' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function fmtM2(n: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' €/m²'
}

function RoiBar({ roi }: { roi: number }) {
  const clamped = Math.max(-100, Math.min(200, roi))
  const pct = ((clamped + 100) / 300) * 100
  const color = roi >= 50 ? '#16a34a' : roi >= 0 ? '#d97706' : '#dc2626'
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
      <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export function RenoCalculator({ surface, currentValue }: Props) {
  const [open, setOpen] = useState(false)
  const [fromClass, setFromClass] = useState<DpeClass>('F')
  const [toClass, setToClass] = useState<DpeClass>('D')

  const targets = getRenoTargets(fromClass)
  const validTo = targets.includes(toClass) ? toClass : targets[targets.length - 1]
  const result = calculateRoi(fromClass, validTo, surface, currentValue)

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between group/btn"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-sm">
            🔧
          </div>
          <span className="text-xs font-semibold text-indigo-600 group-hover/btn:text-indigo-700">
            Simuler une rénovation
          </span>
        </div>
        <span className="text-slate-300 text-xs transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {/* DPE selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-400 font-medium mb-2">Classe actuelle</p>
              <div className="flex gap-1">
                {DPE_CLASSES.map(c => (
                  <button
                    key={c}
                    onClick={() => {
                      setFromClass(c)
                      const newTargets = getRenoTargets(c)
                      if (!newTargets.includes(toClass)) setToClass(newTargets[newTargets.length - 1] ?? 'D')
                    }}
                    title={DPE_STYLE[c].label}
                    className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                      fromClass === c ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : 'opacity-50 hover:opacity-80'
                    }`}
                    style={{ background: DPE_STYLE[c].bg, color: DPE_STYLE[c].text }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium mb-2">Classe cible</p>
              <div className="flex gap-1">
                {DPE_CLASSES.map(c => {
                  const available = targets.includes(c)
                  return (
                    <button
                      key={c}
                      disabled={!available}
                      onClick={() => setToClass(c)}
                      title={available ? DPE_STYLE[c].label : 'Dégradation non simulée'}
                      className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                        !available
                          ? 'opacity-15 cursor-not-allowed'
                          : validTo === c
                          ? 'ring-2 ring-offset-1 ring-slate-400 scale-110'
                          : 'opacity-50 hover:opacity-80'
                      }`}
                      style={available ? { background: DPE_STYLE[c].bg, color: DPE_STYLE[c].text } : { background: '#e2e8f0', color: '#cbd5e1' }}
                    >
                      {c}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Arrow between classes */}
          {result && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-black px-2 py-0.5 rounded" style={{ background: DPE_STYLE[fromClass].bg, color: DPE_STYLE[fromClass].text }}>
                {fromClass}
              </span>
              <span className="flex-1 border-t border-dashed border-slate-200" />
              <span className="text-slate-300">→</span>
              <span className="flex-1 border-t border-dashed border-slate-200" />
              <span className="font-black px-2 py-0.5 rounded" style={{ background: DPE_STYLE[validTo].bg, color: DPE_STYLE[validTo].text }}>
                {validTo}
              </span>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="rounded-xl overflow-hidden border border-slate-100">
              {/* Top stats */}
              <div className="grid grid-cols-2 divide-x divide-slate-100">
                <div className="p-3 bg-slate-50">
                  <p className="text-xs text-slate-400 mb-0.5">Coût travaux</p>
                  <p className="text-sm font-bold text-slate-700">{fmt(result.renoCost)}</p>
                </div>
                <div className="p-3 bg-slate-50">
                  <p className="text-xs text-slate-400 mb-0.5">Valeur post-réno</p>
                  <p className="text-sm font-bold text-slate-700">{fmt(result.postRenoValue)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100">
                <div className="p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Prix/m² actuel</p>
                  <p className="text-xs font-semibold text-slate-600">{fmtM2(result.currentPricePerM2)}</p>
                </div>
                <div className="p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Prix/m² post-réno</p>
                  <p className="text-xs font-semibold text-slate-600">{fmtM2(result.postRenoValuePerM2)}</p>
                </div>
              </div>

              {/* ROI highlight */}
              <div className="p-3 border-t border-slate-100 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-xs text-slate-400">Plus-value nette</p>
                    <p className={`text-base font-black ${result.netGain >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {result.netGain >= 0 ? '+' : ''}{fmt(result.netGain)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">ROI</p>
                    <p className={`text-2xl font-black leading-none ${result.roi >= 50 ? 'text-emerald-600' : result.roi >= 0 ? 'text-amber-500' : 'text-red-500'}`}>
                      {result.roi >= 0 ? '+' : ''}{result.roi.toFixed(0)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Retour invest.</p>
                    <p className="text-sm font-bold text-slate-700">
                      {result.paybackYears === Infinity ? '—' : `${result.paybackYears.toFixed(1)} ans`}
                    </p>
                  </div>
                </div>
                <RoiBar roi={result.roi} />
              </div>

              <div className="px-3 py-2 bg-slate-50 border-t border-slate-100">
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  Estimations ADEME 2024 · Valeur verte Notaires de France
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
