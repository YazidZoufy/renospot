import type { DvfTransaction } from '../types/dvf'
import { RenoCalculator } from './RenoCalculator'

interface Props {
  transaction: DvfTransaction
}

const TYPE_CONFIG: Record<string, { label: string; color: string; border: string; bg: string }> = {
  Appartement:                                      { label: 'Appartement',      color: 'text-blue-600',   border: 'border-blue-400',   bg: 'bg-blue-50' },
  Maison:                                           { label: 'Maison',           color: 'text-emerald-600', border: 'border-emerald-400', bg: 'bg-emerald-50' },
  'Local industriel. commercial ou assimilé':       { label: 'Local commercial', color: 'text-orange-600', border: 'border-orange-400', bg: 'bg-orange-50' },
  Dépendance:                                       { label: 'Dépendance',       color: 'text-slate-500',  border: 'border-slate-300',  bg: 'bg-slate-50' },
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price)
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr))
}

export function TransactionCard({ transaction: t }: Props) {
  const config = TYPE_CONFIG[t.type_local] ?? TYPE_CONFIG['Dépendance']
  const canCalculate = !!t.surface_reelle_bati && t.surface_reelle_bati > 0
  const ppm2 = canCalculate ? Math.round(t.valeur_fonciere / t.surface_reelle_bati!) : null

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group`}>
      {/* Top accent bar */}
      <div className={`h-1 w-full ${config.border.replace('border-', 'bg-')}`} />

      <div className="p-5">
        {/* Type badge + date */}
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${config.bg} ${config.color}`}>
            {config.label}
          </span>
          <span className="text-xs text-slate-300">{formatDate(t.date_mutation)}</span>
        </div>

        {/* Address */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-slate-800 leading-tight truncate">
            {t.adresse_numero ? `${t.adresse_numero} ` : ''}{t.adresse_nom_voie || '—'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{t.com_name}</p>
        </div>

        {/* Price block */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-black text-slate-900 leading-none">
              {formatPrice(t.valeur_fonciere)}
            </p>
            {ppm2 && (
              <p className="text-xs text-slate-400 mt-1">
                {ppm2.toLocaleString('fr-FR')} €/m²
              </p>
            )}
          </div>

          {t.surface_reelle_bati && (
            <div className="text-right">
              <p className="text-lg font-bold text-slate-700">{t.surface_reelle_bati} m²</p>
              {t.nombre_pieces_principales ? (
                <p className="text-xs text-slate-400">
                  {t.nombre_pieces_principales} pièce{t.nombre_pieces_principales > 1 ? 's' : ''}
                </p>
              ) : null}
            </div>
          )}
        </div>

        {/* ROI section */}
        {canCalculate ? (
          <RenoCalculator surface={t.surface_reelle_bati!} currentValue={t.valeur_fonciere} />
        ) : (
          <div className="mt-4 pt-4 border-t border-slate-50">
            <p className="text-xs text-slate-300 italic">Surface non renseignée — calcul ROI indisponible</p>
          </div>
        )}
      </div>
    </div>
  )
}
