// Run with: node scripts/fetch-dvf.js
// Fetches 1000 Paris DVF records with coordinates and saves to src/data/dvf-paris.json

import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const BASE_URL =
  'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/buildingref-france-demande-de-valeurs-foncieres-geolocalisee-millesime/records'

const WHERE = [
  "dep_code='75'",
  "type_local IS NOT NULL",
  "valeur_fonciere IS NOT NULL",
  "latitude IS NOT NULL",
  "longitude IS NOT NULL",
].join(' AND ')

const BATCH = 100
const TOTAL = 1000

async function fetchBatch(offset) {
  const params = new URLSearchParams({
    where: WHERE,
    limit: String(BATCH),
    offset: String(offset),
    order_by: 'date_mutation DESC',
  })
  const res = await fetch(`${BASE_URL}?${params}`)
  if (!res.ok) throw new Error(`HTTP ${res.status} at offset ${offset}`)
  const data = await res.json()
  return data.results ?? []
}

console.log(`Fetching ${TOTAL} Paris DVF records in ${TOTAL / BATCH} parallel batches…`)

const offsets = Array.from({ length: TOTAL / BATCH }, (_, i) => i * BATCH)
const batches = await Promise.all(offsets.map(fetchBatch))
const records = batches.flat()

console.log(`✓ Got ${records.length} records`)

// Normalize to our DvfTransaction shape
const normalized = records.map(r => ({
  id: r.id_mutation,
  date_mutation: r.date_mutation,
  valeur_fonciere: r.valeur_fonciere,
  adresse_numero: r.adresse_numero ?? null,
  adresse_nom_voie: r.adresse_nom_voie ?? '',
  code_postal: r.code_postal ?? '',
  com_name: r.com_name ?? 'Paris',
  dep_code: r.dep_code ?? '75',
  surface_reelle_bati: r.surface_reelle_bati ?? null,
  nombre_pieces_principales: r.nombre_pieces_principales ?? null,
  type_local: r.type_local,
  longitude: r.longitude,
  latitude: r.latitude,
}))

const outPath = join(__dirname, '../src/data/dvf-paris.json')
writeFileSync(outPath, JSON.stringify(normalized, null, 2))
console.log(`✓ Saved to src/data/dvf-paris.json (${(JSON.stringify(normalized).length / 1024).toFixed(0)} KB)`)
