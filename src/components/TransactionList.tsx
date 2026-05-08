import { useState } from 'react'
import type { DvfTransaction } from '../types/dvf'
import type { SortConfig } from '../types/sort'
import { sortTransactions } from '../utils/sort'
import { TransactionCard } from './TransactionCard'
import { SortBar } from './SortBar'

interface Props {
  transactions: DvfTransaction[]
  total: number
  loading: boolean
  error: string | null
  page: number
  pageSize: number
  onPageChange: (page: number) => void
}

const DEFAULT_SORT: SortConfig = { field: 'date', direction: 'desc', renoFrom: 'G', renoTo: 'D' }

export function TransactionList({ transactions, total, loading, error, page, pageSize, onPageChange }: Props) {
  const [sort, setSort] = useState<SortConfig>(DEFAULT_SORT)
  const sorted = sortTransactions(transactions, sort)
  const totalPages = Math.ceil(total / pageSize)
  const start = page * pageSize + 1
  const end = Math.min((page + 1) * pageSize, total)

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center bg-red-50 border border-red-100 rounded-2xl p-8 max-w-sm">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="font-semibold text-red-700 mb-1">Erreur de chargement</p>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-0">
      {/* Count + sort */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              Chargement…
            </span>
          ) : (
            <>
              <span className="font-bold text-slate-800">{total.toLocaleString('fr-FR')}</span>
              {' '}transactions{total > 0 && <span className="text-slate-300"> · {start}–{end}</span>}
            </>
          )}
        </p>
      </div>

      <SortBar sort={sort} onChange={setSort} />

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
              <div className="h-1 bg-slate-200" />
              <div className="p-5 space-y-3">
                <div className="flex justify-between">
                  <div className="h-5 w-24 bg-slate-100 rounded-lg" />
                  <div className="h-4 w-16 bg-slate-100 rounded" />
                </div>
                <div className="h-4 w-3/4 bg-slate-100 rounded" />
                <div className="h-3 w-1/3 bg-slate-100 rounded" />
                <div className="h-7 w-1/2 bg-slate-200 rounded mt-2" />
                <div className="h-3 w-1/4 bg-slate-100 rounded" />
                <div className="h-px bg-slate-100 mt-2" />
                <div className="h-5 w-36 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-slate-600 font-semibold mb-1">Aucun résultat</p>
          <p className="text-slate-400 text-sm">Essayez d'élargir vos filtres</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map(t => (
            <TransactionCard key={t.id + t.date_mutation} transaction={t} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:border-indigo-200 hover:text-indigo-600 transition-all"
          >
            ← Précédent
          </button>
          <span className="text-sm text-slate-400 font-medium">
            {page + 1} <span className="text-slate-200">/</span> {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:border-indigo-200 hover:text-indigo-600 transition-all"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}
