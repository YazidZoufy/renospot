import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { DvfTransaction } from '../types/dvf'
import { computeRenoEstimate, type DpeClass } from '../utils/reno'
import { ALL_TRANSACTIONS } from '../services/dvfApi'

const DPE_BG: Record<DpeClass, string> = { A:'#319B42', B:'#5BB660', C:'#B7CD3D', D:'#F4E70F', E:'#F0B40F', F:'#E87A19', G:'#C7251A' }
const DPE_FG: Record<DpeClass, string> = { A:'#fff',    B:'#0B2A12', C:'#1A2200', D:'#2A2300', E:'#2A1A00', F:'#fff',    G:'#fff'    }

function roiColor(roi: number): string {
  if (roi >= 60) return '#16C172'
  if (roi >= 20) return '#F0B40F'
  if (roi >=  0) return '#E87A19'
  return '#C7251A'
}
function roiTextColor(roi: number): string {
  if (roi >= 60) return '#062014'
  if (roi >= 20) return '#2A1A00'
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
function fmtDate(d: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d))
}

const TYPE_LABEL: Record<string, string> = {
  'Appartement': 'Appartement',
  'Maison': 'Maison',
  'Local industriel. commercial ou assimilé': 'Local commercial',
  'Dépendance': 'Dépendance',
}

const DPE_NEEDS_RENO: DpeClass[] = ['E', 'F', 'G']

function MapRecenter({ transactions }: { transactions: DvfTransaction[] }) {
  const map = useMap()
  useEffect(() => {
    if (transactions.length === 0) return
    const bounds = L.latLngBounds(transactions.map(t => [t.latitude!, t.longitude!]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }, [transactions, map])
  return null
}

function DpePicker({ value, onChange }: { value: DpeClass; onChange: (c: DpeClass) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10,
      background: 'var(--rs-card)', border: '1px solid var(--rs-ledger)',
      borderRadius: 'var(--rs-r-md)', padding: '8px 14px', boxShadow: 'var(--rs-shadow-sm)' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--rs-ink-3)', fontFamily: 'var(--rs-font-mono)',
        textTransform: 'uppercase', letterSpacing: '0.06em' }}>DPE actuel</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {(['E','F','G'] as DpeClass[]).map(c => (
          <button key={c} onClick={() => onChange(c)}
            style={{ width: 26, height: 26, borderRadius: 5, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 12, background: DPE_BG[c], color: DPE_FG[c],
              outline: value === c ? '2px solid var(--rs-ink)' : 'none', outlineOffset: 2 }}>
            {c}
          </button>
        ))}
      </div>
      <span style={{ fontSize: 11, color: 'var(--rs-ink-4)' }}>→ objectif D</span>
      {/* Legend */}
      <div style={{ borderLeft: '1px solid var(--rs-ledger)', paddingLeft: 10, marginLeft: 4, display: 'flex', gap: 10 }}>
        {([['#16C172','≥ 60%'],['#F0B40F','20–60%'],['#E87A19','0–20%'],['#C7251A','< 0%']] as [string,string][]).map(([c,l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
            <span style={{ fontSize: 11, color: 'var(--rs-ink-4)' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface Props { transactions: DvfTransaction[]; total: number; loaded: number; loading: boolean }

export function MapView({ transactions, total, loaded, loading }: Props) {
  const [currentDpe, setCurrentDpe] = useState<DpeClass>('F')

  const withCoords = transactions.filter(t => t.latitude && t.longitude)
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
        <DpePicker value={currentDpe} onChange={setCurrentDpe} />
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
            const needsReno = DPE_NEEDS_RENO.includes(currentDpe)
            const result = needsReno && t.surface_reelle_bati
              ? computeRenoEstimate(t, ALL_TRANSACTIONS, currentDpe)
              : null
            const pinBg    = result ? roiColor(result.roi) : '#9A9180'
            const pinFg    = result ? roiTextColor(result.roi) : '#fff'
            const pinLabel = result ? (result.roi >= 0 ? `+${Math.round(result.roi)}%` : `${Math.round(result.roi)}%`) : '–'
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
                      <span style={{ fontFamily: 'var(--rs-font-mono)', fontSize: 10, color: 'var(--rs-ink-4)' }}>
                        {fmtDate(t.date_mutation)}
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

                    {/* ROI block — only gain + ROI % */}
                    {result ? (
                      <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10,
                        background: result.netGain >= 0 ? '#E2FBEE' : '#FBE4E1',
                        border: `1px solid ${result.netGain >= 0 ? '#BBF4D6' : 'rgba(199,37,26,0.2)'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--rs-ink-4)', marginBottom: 3 }}>Gain potentiel net</div>
                            <div style={{ fontFamily: 'var(--rs-font-serif)', fontSize: 16, fontWeight: 500,
                              color: result.netGain >= 0 ? '#0B7E4A' : '#821813',
                              fontVariantNumeric: 'tabular-nums' }}>
                              {result.netGain >= 0 ? '+' : ''}{fmt(result.netGain)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 10, color: 'var(--rs-ink-4)', marginBottom: 3 }}>ROI</div>
                            <div style={{ fontFamily: 'var(--rs-font-serif)', fontSize: 20, fontWeight: 500,
                              color: result.roi >= 0 ? '#0B7E4A' : '#821813' }}>
                              {result.roi >= 0 ? '+' : ''}{result.roi.toFixed(0)}%
                            </div>
                          </div>
                        </div>
                        <div style={{ marginTop: 6, height: 3, background: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 99,
                            width: `${Math.max(0, Math.min(100, ((result.roi + 100) / 300) * 100))}%`,
                            background: result.netGain >= 0 ? '#16C172' : '#C7251A' }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--rs-paper-2)' }}>
                        <span style={{ fontSize: 11, color: 'var(--rs-ink-4)', fontStyle: 'italic' }}>
                          {!t.surface_reelle_bati ? 'Surface non renseignée' : 'Classe DPE ≤ D — pas de rénovation requise'}
                        </span>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(247,244,238,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
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
