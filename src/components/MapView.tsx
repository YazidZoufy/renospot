import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import type { DvfTransaction } from '../types/dvf'
import { calculateRoi, type DpeClass } from '../utils/reno'

import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
L.Marker.prototype.options.icon = L.icon({ iconUrl, shadowUrl: iconShadow, iconAnchor: [12, 41] })

interface Props {
  transactions: DvfTransaction[]
  total: number
  loaded: number
  loading: boolean
}

const TYPE_COLOR: Record<string, string> = {
  Appartement: '#6366f1',
  Maison: '#10b981',
  'Local industriel. commercial ou assimilé': '#f97316',
  Dépendance: '#94a3b8',
}

const TYPE_LABEL: Record<string, string> = {
  Appartement: 'Appartement',
  Maison: 'Maison',
  'Local industriel. commercial ou assimilé': 'Local commercial',
  Dépendance: 'Dépendance',
}

const DPE_BG: Record<DpeClass, string> = {
  A: '#16a34a', B: '#4ade80', C: '#a3e635',
  D: '#facc15', E: '#fb923c', F: '#ea580c', G: '#dc2626',
}
const DPE_FG: Record<DpeClass, string> = {
  A: '#fff', B: '#14532d', C: '#365314',
  D: '#713f12', E: '#fff', F: '#fff', G: '#fff',
}

function roiColor(roi: number): string {
  if (roi >= 60) return '#16a34a'
  if (roi >= 20) return '#f59e0b'
  if (roi >= 0)  return '#f97316'
  return '#dc2626'
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d))
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

// Scenario picker shown above the map
function ScenarioPicker({
  from, to, onChange,
}: {
  from: DpeClass; to: DpeClass
  onChange: (from: DpeClass, to: DpeClass) => void
}) {
  const FROM_OPTIONS: DpeClass[] = ['G', 'F', 'E', 'D']
  const TO_OPTIONS:   DpeClass[] = ['C', 'D', 'B', 'A']

  return (
    <div className="flex items-center gap-3 bg-white border border-slate-100 shadow-sm rounded-xl px-4 py-2.5">
      <span className="text-xs font-semibold text-slate-400 shrink-0">Scénario réno :</span>
      <div className="flex gap-1">
        {FROM_OPTIONS.map(c => (
          <button key={c} onClick={() => onChange(c, to)}
            className="w-6 h-6 rounded text-[11px] font-black transition-all"
            style={{ background: DPE_BG[c], color: DPE_FG[c], outline: from === c ? '2px solid #6366f1' : 'none', outlineOffset: 2 }}>
            {c}
          </button>
        ))}
      </div>
      <span className="text-slate-300 text-sm">→</span>
      <div className="flex gap-1">
        {TO_OPTIONS.map(c => {
          const valid = ['A','B','C','D','E','F','G'].indexOf(c) < ['A','B','C','D','E','F','G'].indexOf(from)
          return (
            <button key={c} disabled={!valid} onClick={() => valid && onChange(from, c)}
              className="w-6 h-6 rounded text-[11px] font-black transition-all"
              style={{
                background: valid ? DPE_BG[c] : '#e2e8f0',
                color: valid ? DPE_FG[c] : '#cbd5e1',
                cursor: valid ? 'pointer' : 'not-allowed',
                outline: to === c && valid ? '2px solid #6366f1' : 'none',
                outlineOffset: 2,
              }}>
              {c}
            </button>
          )
        })}
      </div>

      {/* ROI legend */}
      <div className="ml-3 flex items-center gap-3 border-l border-slate-100 pl-3">
        {([['#16a34a', '≥ 60%'], ['#f59e0b', '20–60%'], ['#f97316', '0–20%'], ['#dc2626', '< 0%']] as [string, string][]).map(([c, l]) => (
          <div key={l} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            <span className="text-xs text-slate-400">{l}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="text-xs text-slate-400">Sans surface</span>
        </div>
      </div>
    </div>
  )
}

export function MapView({ transactions, total, loaded, loading }: Props) {
  const [renoFrom, setRenoFrom] = useState<DpeClass>('F')
  const [renoTo, setRenoTo]     = useState<DpeClass>('D')

  const withCoords = transactions.filter(t => t.latitude && t.longitude)
  const pct = total > 0 ? Math.round((loaded / Math.min(total, 500)) * 100) : 0

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-3">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-slate-500">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              Chargement…
              {total > 0 && <span className="text-slate-300">{pct}%</span>}
            </span>
          ) : (
            <>
              <span className="font-bold text-slate-800">{withCoords.length.toLocaleString('fr-FR')}</span> biens sur la carte
              {total > 500 && <span className="text-slate-300"> · sur {total.toLocaleString('fr-FR')} au total</span>}
            </>
          )}
        </p>

        <ScenarioPicker from={renoFrom} to={renoTo} onChange={(f, t) => { setRenoFrom(f); setRenoTo(t) }} />
      </div>

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm"
        style={{ height: 'calc(100vh - 300px)', minHeight: 500 }}>
        <MapContainer center={[48.8566, 2.3522]} zoom={12}
          style={{ width: '100%', height: '100%' }} zoomControl={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          <MapRecenter transactions={withCoords} />

          {withCoords.map(t => {
            const result = t.surface_reelle_bati
              ? calculateRoi(renoFrom, renoTo, t.surface_reelle_bati, t.valeur_fonciere)
              : null

            const markerColor = result ? roiColor(result.roi) : TYPE_COLOR[t.type_local] ?? '#94a3b8'
            const ppm2 = t.surface_reelle_bati
              ? Math.round(t.valeur_fonciere / t.surface_reelle_bati)
              : null

            return (
              <CircleMarker
                key={t.id + t.date_mutation}
                center={[t.latitude!, t.longitude!]}
                radius={result ? 8 : 6}
                pathOptions={{
                  fillColor: markerColor,
                  fillOpacity: 0.88,
                  color: '#fff',
                  weight: 1.5,
                }}
              >
                <Popup closeButton={false} minWidth={240} maxWidth={280}>
                  <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2px' }}>

                    {/* Header: type + date */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                        background: (TYPE_COLOR[t.type_local] ?? '#94a3b8') + '20',
                        color: TYPE_COLOR[t.type_local] ?? '#94a3b8',
                      }}>
                        {TYPE_LABEL[t.type_local] ?? t.type_local}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{formatDate(t.date_mutation)}</span>
                    </div>

                    {/* Address */}
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 2, lineHeight: 1.3 }}>
                      {t.adresse_numero ? `${t.adresse_numero} ` : ''}{t.adresse_nom_voie || '—'}
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>{t.com_name}</p>

                    {/* Price */}
                    <p style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', lineHeight: 1, marginBottom: 2 }}>
                      {fmt(t.valeur_fonciere)}
                    </p>
                    {ppm2 && (
                      <p style={{ fontSize: 11, color: '#94a3b8' }}>
                        {ppm2.toLocaleString('fr-FR')} €/m²
                      </p>
                    )}

                    {/* Surface + rooms */}
                    {(t.surface_reelle_bati || t.nombre_pieces_principales) && (
                      <div style={{ display: 'flex', gap: 16, marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                        {t.surface_reelle_bati && (
                          <div>
                            <p style={{ fontSize: 11, color: '#94a3b8' }}>Surface</p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{t.surface_reelle_bati} m²</p>
                          </div>
                        )}
                        {t.nombre_pieces_principales ? (
                          <div>
                            <p style={{ fontSize: 11, color: '#94a3b8' }}>Pièces</p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{t.nombre_pieces_principales}</p>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* ROI block */}
                    {result ? (
                      <div style={{
                        marginTop: 10, padding: '10px 12px', borderRadius: 10,
                        background: roiColor(result.roi) + '12',
                        border: `1px solid ${roiColor(result.roi)}30`,
                      }}>
                        {/* Scenario label */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>RÉNO</span>
                          <span style={{
                            fontSize: 11, fontWeight: 900, padding: '1px 5px', borderRadius: 4,
                            background: DPE_BG[renoFrom], color: DPE_FG[renoFrom],
                          }}>{renoFrom}</span>
                          <span style={{ fontSize: 10, color: '#cbd5e1' }}>→</span>
                          <span style={{
                            fontSize: 11, fontWeight: 900, padding: '1px 5px', borderRadius: 4,
                            background: DPE_BG[renoTo], color: DPE_FG[renoTo],
                          }}>{renoTo}</span>
                        </div>

                        {/* Stats row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                          <div>
                            <p style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Coût réno</p>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{fmt(result.renoCost)}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Plus-value</p>
                            <p style={{ fontSize: 12, fontWeight: 700, color: result.netGain >= 0 ? '#16a34a' : '#dc2626' }}>
                              {result.netGain >= 0 ? '+' : ''}{fmt(result.netGain)}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>ROI</p>
                            <p style={{ fontSize: 18, fontWeight: 900, color: roiColor(result.roi), lineHeight: 1 }}>
                              {result.roi >= 0 ? '+' : ''}{result.roi.toFixed(0)}%
                            </p>
                          </div>
                        </div>

                        {/* ROI bar */}
                        <div style={{ marginTop: 8, height: 4, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 99,
                            width: `${Math.max(0, Math.min(100, ((result.roi + 100) / 300) * 100))}%`,
                            background: roiColor(result.roi),
                            transition: 'width 0.3s',
                          }} />
                        </div>

                        <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
                          Retour invest. : {result.paybackYears === Infinity ? '—' : `${result.paybackYears.toFixed(1)} ans`}
                        </p>
                      </div>
                    ) : (
                      <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: '#f8fafc' }}>
                        <p style={{ fontSize: 11, color: '#cbd5e1', fontStyle: 'italic' }}>
                          Surface non renseignée — ROI non calculable
                        </p>
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>

        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[1000]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Chargement des biens…</p>
            </div>
          </div>
        )}

        {!loading && withCoords.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-[1000]">
            <div className="text-center bg-white rounded-2xl shadow-lg p-8">
              <div className="text-4xl mb-3">📍</div>
              <p className="font-semibold text-slate-700">Aucun bien localisé</p>
              <p className="text-sm text-slate-400 mt-1">Modifiez vos filtres pour voir des résultats</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
