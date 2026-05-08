import { useState } from 'react'
import { useDvf } from './hooks/useDvf'
import { useMapData } from './hooks/useMapData'
import { FilterSidebar } from './components/FilterSidebar'
import { TransactionList } from './components/TransactionList'
import { MapView } from './components/MapView'

type ViewMode = 'list' | 'map'

const LogoMark = () => (
  <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="12" fill="var(--rs-brand-600)" />
    <path d="M14 32 L32 16 L50 32" stroke="#F7F4EE" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round"/>
    <path d="M19 32 L19 48 L45 48 L45 32" stroke="#F7F4EE" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round" opacity="0.55"/>
    <rect x="24" y="42" width="3.5" height="4" rx="0.8" fill="#16C172"/>
    <rect x="30.25" y="38" width="3.5" height="8" rx="0.8" fill="#16C172"/>
    <rect x="36.5" y="33" width="3.5" height="13" rx="0.8" fill="#16C172"/>
  </svg>
)

function App() {
  const { transactions, total, loading, error, filters, page, pageSize, applyFilters, setPage } = useDvf()
  const mapData = useMapData(filters)
  const [view, setView] = useState<ViewMode>('list')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--rs-paper)' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid var(--rs-ledger)', background: 'var(--rs-card)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 32px' }}>

          {/* Brand row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <LogoMark />
              <div>
                <div style={{ fontFamily: 'var(--rs-font-serif)', fontSize: 24, fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--rs-ink)', lineHeight: 1 }}>
                  Réno<span style={{ color: 'var(--rs-brand-600)' }}>-Score</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--rs-ink-4)', marginTop: 3, fontFamily: 'var(--rs-font-mono)', letterSpacing: '0.04em' }}>
                  Paris · DVF 2024
                </div>
              </div>
            </div>

            {/* View toggle */}
            <div style={{ display: 'flex', background: 'var(--rs-paper-2)', border: '1px solid var(--rs-ledger)', borderRadius: 'var(--rs-r-md)', padding: 3, gap: 2 }}>
              {(['list', 'map'] as ViewMode[]).map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--rs-font-sans)', fontSize: 13, fontWeight: 500,
                  background: view === v ? 'var(--rs-card)' : 'transparent',
                  color: view === v ? 'var(--rs-ink)' : 'var(--rs-ink-3)',
                  boxShadow: view === v ? 'var(--rs-shadow-sm)' : 'none',
                  transition: 'all var(--rs-dur-fast) var(--rs-ease-out)',
                }}>
                  {v === 'list' ? '☰' : '🗺'} {v === 'list' ? 'Liste' : 'Carte'}
                </button>
              ))}
            </div>
          </div>

          {/* Headline + stats */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--rs-font-sans)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--rs-brand-600)', marginBottom: 6 }}>
                Analyse immobilière
              </div>
              <h1 style={{ fontFamily: 'var(--rs-font-serif)', fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--rs-ink)', lineHeight: 1.1, maxWidth: 520 }}>
                Trouvez les biens à fort potentiel de rénovation
              </h1>
            </div>

            {/* Stats pills */}
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              {[
                { label: 'Transactions', value: loading ? '…' : total.toLocaleString('fr-FR') },
                { label: 'Données', value: 'DVF 2024' },
                { label: 'Référentiel', value: 'ADEME' },
              ].map(s => (
                <div key={s.label} style={{
                  padding: '8px 14px', borderRadius: 'var(--rs-r-md)',
                  background: 'var(--rs-paper)', border: '1px solid var(--rs-ledger)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'var(--rs-font-serif)', fontSize: 18, fontWeight: 500, color: 'var(--rs-ink)', fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--rs-ink-4)', marginTop: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 32px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <FilterSidebar filters={filters} onApply={applyFilters} />

        {view === 'list' ? (
          <TransactionList
            transactions={transactions} total={total} loading={loading}
            error={error} page={page} pageSize={pageSize} onPageChange={setPage}
          />
        ) : (
          <MapView
            transactions={mapData.transactions} total={mapData.total}
            loaded={mapData.loaded} loading={mapData.loading}
          />
        )}
      </main>
    </div>
  )
}

export default App
