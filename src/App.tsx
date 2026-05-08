import { useState } from 'react'
import { useDvf } from './hooks/useDvf'
import { useMapData } from './hooks/useMapData'
import { FilterSidebar } from './components/FilterSidebar'
import { TransactionList } from './components/TransactionList'
import { MapView } from './components/MapView'

type ViewMode = 'list' | 'map'

function App() {
  const { transactions, total, loading, error, filters, page, pageSize, applyFilters, setPage } = useDvf()
  const [view, setView] = useState<ViewMode>('list')
  const mapData = useMapData(filters)

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 40%, #0f172a 100%)' }}>
      {/* Hero Header */}
      <header className="relative overflow-hidden px-6 pt-10 pb-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500 opacity-10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-violet-500 opacity-10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              R
            </div>
            <div>
              <span className="text-white font-bold text-xl tracking-tight">Réno-Score</span>
              <span className="ml-2 text-xs text-indigo-300 border border-indigo-700 rounded-full px-2 py-0.5">Paris</span>
            </div>
          </div>

          <h1 className="text-4xl font-black text-white leading-tight max-w-2xl mb-3">
            Trouvez les biens à{' '}
            <span style={{ background: 'linear-gradient(90deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              fort potentiel
            </span>{' '}
            de rénovation
          </h1>
          <p className="text-slate-400 text-base max-w-xl mb-8">
            Analysez les transactions DVF Paris et calculez instantanément le ROI d'une rénovation énergétique.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Stats */}
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Transactions Paris', value: loading ? '…' : total.toLocaleString('fr-FR'), icon: '🏙️' },
                { label: 'Données DVF', value: '2024', icon: '📊' },
                { label: 'Basé sur ADEME', value: 'DPE A→G', icon: '🌿' },
              ].map(stat => (
                <div key={stat.label}
                  className="flex items-center gap-3 bg-white/5 backdrop-blur border border-white/10 rounded-xl px-4 py-3">
                  <span className="text-xl">{stat.icon}</span>
                  <div>
                    <p className="text-white font-bold text-sm leading-none">{stat.value}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex items-center bg-white/10 backdrop-blur border border-white/10 rounded-xl p-1 gap-1">
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  view === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>☰</span> Liste
              </button>
              <button
                onClick={() => setView('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  view === 'map' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🗺️</span> Carte
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="bg-slate-50 rounded-t-3xl min-h-screen">
        <main className="max-w-7xl mx-auto px-6 py-8 flex gap-6 items-start">
          <FilterSidebar filters={filters} onApply={applyFilters} />

          {view === 'list' ? (
            <TransactionList
              transactions={transactions}
              total={total}
              loading={loading}
              error={error}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          ) : (
            <MapView
              transactions={mapData.transactions}
              total={mapData.total}
              loaded={mapData.loaded}
              loading={mapData.loading}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
