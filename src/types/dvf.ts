export interface DvfTransaction {
  id: string
  date_mutation: string
  valeur_fonciere: number
  adresse_numero: number | null
  adresse_nom_voie: string
  code_postal: string
  com_name: string
  dep_code: string
  surface_reelle_bati: number | null
  nombre_pieces_principales: number | null
  type_local: TypeLocal
  longitude: number | null
  latitude: number | null
}

export type TypeLocal =
  | 'Appartement'
  | 'Maison'
  | 'Local industriel. commercial ou assimilé'
  | 'Dépendance'

export interface DvfFilters {
  arrondissement: string
  priceMin: number | ''
  priceMax: number | ''
  typeLocal: TypeLocal | ''
}
