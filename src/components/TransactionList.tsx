import { useState } from 'react'
import type { DvfTransaction } from '../types/dvf'
import type { SortConfig } from '../types/sort'
import { sortTransactions } from '../utils/sort'
import { TransactionCard } from './TransactionCard'
import { SortBar } from './SortBar'

interface Props {
  transactions: DvfTransaction[]; total: number; loading: boolean
  error: string | null; page: number; pageSize: number; onPageChange: (p: number) => void
}

const DEFAULT_SORT: SortConfig = { field: 'date', direction: 'desc', renoFrom: 'G', renoTo: 'D' }

export function TransactionList({ transactions, total, loading, error, page, pageSize, onPageChange }: Props) {
  const [sort, setSort] = useState<SortConfig>(DEFAULT_SORT)
  const sorted = sortTransactions(transactions, sort)
  const totalPages = Math.ceil(total / pageSize)
  const start = page * pageSize + 1
  const end   = Math.min((page + 1) * pageSize, total)

  if (error) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ textAlign: 'center', background: 'var(--rs-danger-bg)', border: '1px solid rgba(199,37,26,0.2)', borderRadius: 'var(--rs-r-lg)', padding: '32px 40px' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
        <div style={{ fontWeight: 600, color: 'var(--rs-danger-fg)', marginBottom: 4 }}>Erreur de chargement</div>
        <div style={{ fontSize: 13, color: 'var(--rs-danger)' }}>{error}</div>
      </div>
    </div>
  )

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: 'var(--rs-ink-3)' }}>
          {loading
            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--rs-brand-300)', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                Chargement…
              </span>
            : <><span style={{ fontWeight: 700, color: 'var(--rs-ink)' }}>{total.toLocaleString('fr-FR')}</span> transactions{total > 0 && <span style={{ color: 'var(--rs-ink-4)' }}> · {start}–{end}</span>}</>
          }
        </p>
      </div>

      <SortBar sort={sort} onChange={setSort} />

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--rs-card)', border: '1px solid var(--rs-ledger)', borderRadius: 'var(--rs-r-lg)', padding: 20, boxShadow: 'var(--rs-shadow-sm)' }}>
              {[['70%', 10], ['45%', 8], ['55%', 28], ['30%', 10]].map(([w, mt], j) => (
                <div key={j} style={{ height: 14, background: 'var(--rs-paper-2)', borderRadius: 6, width: String(w), marginTop: Number(mt), animation: 'pulse 1.2s infinite' }} />
              ))}
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontFamily: 'var(--rs-font-serif)', fontSize: 18, color: 'var(--rs-ink-2)', marginBottom: 4 }}>Aucun résultat</div>
          <div style={{ fontSize: 13, color: 'var(--rs-ink-4)' }}>Essayez d'élargir vos filtres</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {sorted.map(t => <TransactionCard key={t.id + t.date_mutation} transaction={t} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 36 }}>
          <button onClick={() => onPageChange(page - 1)} disabled={page === 0}
            style={{ padding: '8px 16px', borderRadius: 'var(--rs-r-md)', border: '1px solid var(--rs-ledger-strong)', background: 'var(--rs-card)', color: 'var(--rs-ink-2)', fontSize: 13, cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.35 : 1, fontFamily: 'var(--rs-font-sans)' }}>
            ← Précédent
          </button>
          <span style={{ fontSize: 13, color: 'var(--rs-ink-4)' }}>{page + 1} / {totalPages}</span>
          <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1}
            style={{ padding: '8px 16px', borderRadius: 'var(--rs-r-md)', border: '1px solid var(--rs-ledger-strong)', background: 'var(--rs-card)', color: 'var(--rs-ink-2)', fontSize: 13, cursor: page >= totalPages - 1 ? 'default' : 'pointer', opacity: page >= totalPages - 1 ? 0.35 : 1, fontFamily: 'var(--rs-font-sans)' }}>
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}
