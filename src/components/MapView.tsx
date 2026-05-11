import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { DvfTransaction } from '../types/dvf'
import { computeRenoEstimate, type DpeClass } from '../utils/reno'
import { ALL_TRANSACTIONS } from '../services/dvfApi'

const DPE_BG: Record<string, string> = { E:'#F0B40F', F:'#E87A19', G:'#C7251A' }
const DPE_FG: Record<string, string> = { E:'#2A1A00', F:'#fff',    G:'#fff'    }

function upliftColor(pct: number): string {
  if (pct >= 15) return '#16C172'
  if (pct >= 10) return '#F0B40F'
  if (pct >=  5) return '#E87A19'
  return '#C7251A'
}
function upliftTextColor(pct: number): string {
  if (pct >= 15) return '#062014'
  if (pct >= 10) return '#2A1A00'
  return '#fff'
}

function makePinIcon(bg: string, fg: string, label: string): L.DivIcon {
  const svg = `
    <svg width="36" height="42" viewBox="0 0 36 42" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="30" height="30" rx="6" ry="6"
        transform="rotate(45 18 18)"
        fill="${bg}" stroke="white" stroke-width="2"
        filter="drop-shadow(0 4px 8px rgba(40,30,15,.30))"/>
      <text x="18" y="22" text-anchor="middle" dominant-baseline="middle"
        font-family="Geist,system-ui,sans-serif" font-weight="700" font-size="12"
        fill="${fg}">${label}</text>
    </svg>`
  return L.divIcon({ html: svg, className: '', iconSize: [36, 42], iconAnchor: [18, 42], popupAnchor: [0, -44] })
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

const TYPE_LABEL: Record<string, string> = {
  'Appartement': 'Appartement',
  'Maison': 'Maison',
  'Local industriel. commercial ou assimilé': 'Local commercial',
  'Dépendance': 'Dépendance',
}

function MapRecenter({ transactions }: { transactions: DvfTransaction[] }) {
  const map = useMap()
  useEffect(() => {
    if (transactions.length === 0) return
    const bounds = L.latLngBounds(transactions.map(t => [t.latitude!, t.longitude!]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }, [transactions, map])
  return null
}

function Legend() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--rs-card)', border: '1px solid var(--rs-ledger)',
      borderRadius: 'var(--rs-r-md)', padding: '8px 14px', boxShadow: 'var(--rs-shadow-sm)' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--rs-ink-3)',
        fontFamily: 'var(--rs-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ROI</span>
      {([['#16C172','≥ 15%'],['#F0B40F','10–15%'],['#E87A19','5–10%'],['#C7251A','< 5%']] as [string,string][]).map(([c,l]) => (
        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
          <span style={{ fontSize: 11, color: 'var(--rs-ink-4)' }}>{l}</span>
        </div>
      ))}
      <div style={{ borderLeft: '1px solid var(--rs-ledger)', paddingLeft: 10, marginLeft: 4,
        display: 'flex', gap: 6 }}>
        {(['E','F','G'] as const).map(c => (
          <span key={c} style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
            background: DPE_BG[c], color: DPE_FG[c] }}>{c}</span>
        ))}
        <span style={{ fontSize: 11, color: 'var(--rs-ink-4)' }}>DPE réel → D</span>
      </div>
    </div>
  )
}

interface Props { transactions: DvfTransaction[]; total: number; loaded: number; loading: boolean }

export function MapView({ transactions, total, loaded, loading }: Props) {
  const withCoords = transactions.filter(t => t.latitude && t.longitude && t.dpe_classe)
  const pct = total > 0 ? Math.round((loaded / Math.min(total, 500)) * 100) : 0

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <p style={{ fontSize: 13, color: 'var(--rs-ink-3)' }}>
          {loading
            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--rs-brand-300)', display: 'inline-block' }} />
                Chargement… {total > 0 && `${pct}%`}
              </span>
            : <><span style={{ fontWeight: 700, color: 'var(--rs-ink)' }}>{withCoords.length.toLocaleString('fr-FR')}</span> biens localisés</>
          }
        </p>
        <Legend />
      </div>

      {/* Map */}
      <div style={{ position: 'relative', borderRadius: 'var(--rs-r-lg)', overflow: 'hidden',
        border: '1px solid var(--rs-ledger)', boxShadow: 'var(--rs-shadow-md)',
        height: 'calc(100vh - 320px)', minHeight: 500 }}>
        <MapContainer center={[48.8566, 2.3522]} zoom={12}
          style={{ width: '100%', height: '100%' }} zoomControl={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          <MapRecenter transactions={withCoords} />

          {withCoords.map(t => {
            const dpe = t.dpe_classe as DpeClass
            const result = computeRenoEstimate(t, ALL_TRANSACTIONS, dpe)
            const pinBg    = result ? upliftColor(result.valueUpliftPct) : '#9A9180'
            const pinFg    = result ? upliftTextColor(result.valueUpliftPct) : '#fff'
            const pinLabel = result ? `+${result.valueUpliftPct.toFixed(0)}%` : '–'
            const icon = makePinIcon(pinBg, pinFg, pinLabel)
            const ppm2 = t.surface_reelle_bati ? Math.round(t.valeur_fonciere / t.surface_reelle_bati) : null

            return (
              <Marker key={t.id + t.date_mutation} position={[t.latitude!, t.longitude!]} icon={icon}>
                <Popup closeButton={false} minWidth={230} maxWidth={260}>
                  <div style={{ fontFamily: 'var(--rs-font-sans)', padding: '14px 16px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--rs-brand-600)',
                        background: 'var(--rs-brand-50)', padding: '2px 8px', borderRadius: 99 }}>
                        {TYPE_LABEL[t.type_local] ?? t.type_local}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                        background: DPE_BG[dpe], color: DPE_FG[dpe] }}>
                        {dpe}
                      </span>
                    </div>

                    {/* Address */}
                    <div style={{ fontFamily: 'var(--rs-font-serif)', fontSize: 15, fontWeight: 500,
                      color: 'var(--rs-ink)', lineHeight: 1.3, marginBottom: 2 }}>
                      {t.adresse_numero ? `${t.adresse_numero} ` : ''}{t.adresse_nom_voie || '—'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--rs-ink-4)', marginBottom: 10 }}>{t.com_name}</div>

                    {/* Price + surface */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--rs-font-serif)', fontSize: 20, fontWeight: 500,
                          color: 'var(--rs-ink)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                          {fmt(t.valeur_fonciere)}
                        </div>
                        {ppm2 && <div style={{ fontSize: 11, color: 'var(--rs-ink-4)', marginTop: 3 }}>
                          {ppm2.toLocaleString('fr-FR')} €/m²
                        </div>}
                      </div>
                      {t.surface_reelle_bati && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--rs-ink-2)' }}>
                            {t.surface_reelle_bati} m²
                          </div>
                          {t.nombre_pieces_principales ? (
                            <div style={{ fontSize: 11, color: 'var(--rs-ink-4)' }}>
                              {t.nombre_pieces_principales} p.
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* ROI block */}
                    {result ? (
                      <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10,
                        background: '#E2FBEE', border: '1px solid #BBF4D6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--rs-ink-4)', marginBottom: 3 }}>Gain estimé</div>
                            <div style={{ fontFamily: 'var(--rs-font-serif)', fontSize: 16, fontWeight: 500,
                              color: '#0B7E4A', fontVariantNumeric: 'tabular-nums' }}>
                              +{fmt(result.grossGain)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 10, color: 'var(--rs-ink-4)', marginBottom: 3 }}>vs prix actuel</div>
                            <div style={{ fontFamily: 'var(--rs-font-serif)', fontSize: 20, fontWeight: 500,
                              color: '#0B7E4A' }}>
                              +{result.valueUpliftPct.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div style={{ marginTop: 6, height: 3, background: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 99,
                            width: `${Math.min(100, result.valueUpliftPct * 5)}%`,
                            background: '#16C172' }} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(247,244,238,0.75)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, border: '2px solid var(--rs-ledger-strong)',
                borderTopColor: 'var(--rs-brand-600)', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 13, color: 'var(--rs-ink-3)', fontFamily: 'var(--rs-font-sans)' }}>Chargement…</div>
            </div>
          </div>
        )}

        {!loading && withCoords.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ textAlign: 'center', background: 'var(--rs-card)', borderRadius: 'var(--rs-r-lg)',
              boxShadow: 'var(--rs-shadow-lg)', padding: '32px 40px' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📍</div>
              <div style={{ fontFamily: 'var(--rs-font-serif)', fontSize: 18, color: 'var(--rs-ink-2)' }}>Aucun bien localisé</div>
              <div style={{ fontSize: 13, color: 'var(--rs-ink-4)', marginTop: 4 }}>Modifiez vos filtres</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
