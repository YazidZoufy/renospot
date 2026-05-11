"""
Enrich dvf-paris.json with DPE classes from dep_75.csv.gz
Two-pass matching:
  1. Strict: numero + code_postal + normalized_voie
  2. Fuzzy:  code_postal + normalized_voie (street only, pick by surface proximity)
"""

import csv, gzip, json, re, unicodedata
from pathlib import Path
from collections import defaultdict

DVF_PATH = Path(__file__).parent.parent / 'src/data/dvf-paris.json'
DPE_PATH = Path('/Users/yazidzoufi/Downloads/dep_75.csv.gz')
OUT_PATH = DVF_PATH

DVF_EXPAND = {
    'AV':'AVENUE','AVE':'AVENUE',
    'BD':'BOULEVARD','BLV':'BOULEVARD','BLVD':'BOULEVARD',
    'PL':'PLACE','IMP':'IMPASSE','ALL':'ALLEE','SQ':'SQUARE',
    'PASS':'PASSAGE','VLA':'VILLA','VL':'VILLA',
    'QU':'QUAI','RTE':'ROUTE','CHE':'CHEMIN','CHEM':'CHEMIN',
    'CRS':'COURS','CIT':'CITE','RES':'RESIDENCE',
    'FBG':'FAUBOURG','FB':'FAUBOURG',
    'ST':'SAINT','STE':'SAINTE',
    'GD':'GRAND','GDE':'GRANDE','PTE':'PETITE',
    'DR':'DOCTEUR','GEN':'GENERAL','MAR':'MARECHAL','PRF':'PROFESSEUR',
}

def remove_accents(s: str) -> str:
    return ''.join(c for c in unicodedata.normalize('NFD', s)
                   if unicodedata.category(c) != 'Mn')

def normalize(s: str) -> str:
    s = remove_accents(s.upper())
    s = re.sub(r"['’\-\.\,\/\\&;]", ' ', s)
    s = re.sub(r'APOS;', ' ', s)        # html entity remnants
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def expand_dvf(voie: str) -> str:
    """Expand ALL abbreviated tokens in a DVF voie string."""
    parts = voie.split()
    return ' '.join(DVF_EXPAND.get(p, p) for p in parts)

def parse_dpe_nom_rue(nom_rue: str):
    """Return (numero_str, normalized_voie) from DPE nom_rue."""
    s = normalize(nom_rue)
    # Pattern: optional leading number (possibly like "32" or "32A" or "32-34")
    m = re.match(r'^(\d+[A-Z]?\d*)\s*[,\s]\s*(.+)$', s)
    if m:
        return m.group(1), m.group(2).strip()
    # No number found — street only
    return '', s

def strict_key(numero, voie_norm, cp):
    return (str(numero), cp, voie_norm)

def street_key(voie_norm, cp):
    return (cp, voie_norm)

# ── Build DPE lookups ────────────────────────────────────────────────────────
print("Loading DPE data…")

# strict_lookup: (numero, cp, voie) → (classe, date, surface)
strict_lookup: dict[tuple, tuple] = {}
# street_lookup: (cp, voie) → list of (numero, classe, surface)
street_lookup: dict[tuple, list] = defaultdict(list)

VALID = {'E', 'F', 'G'}

with gzip.open(DPE_PATH, 'rt', encoding='utf-8', errors='replace') as f:
    reader = csv.DictReader(f)
    for row in reader:
        classe = row['classe_consommation_energie'].strip()
        if classe not in VALID:
            continue
        cp = row['code_postal'].strip()
        if not cp.startswith('75'):
            continue
        numero, voie = parse_dpe_nom_rue(row['nom_rue'])
        if not voie:
            continue
        # Expand DPE voie types too (some DPE entries use abbreviations)
        voie_exp = expand_dvf(voie)
        date = row['date_etablissement_dpe'].strip()
        try:
            surface = float(row['surface_habitable'])
        except (ValueError, KeyError):
            surface = 0.0

        sk = strict_key(numero, voie_exp, cp)
        if sk not in strict_lookup or date > strict_lookup[sk][1]:
            strict_lookup[sk] = (classe, date, surface)

        stk = street_key(voie_exp, cp)
        street_lookup[stk].append((numero, classe, surface, date))

print(f"  {len(strict_lookup):,} strict keys  |  {len(street_lookup):,} street keys")

# ── Match DVF ────────────────────────────────────────────────────────────────
print("Matching DVF transactions…")
with open(DVF_PATH) as f:
    transactions = json.load(f)

strict_hits = fuzzy_hits = 0

for t in transactions:
    t.pop('dpe_classe', None)
    if not t.get('surface_reelle_bati'):
        continue

    numero = str(t.get('adresse_numero', '') or '')
    voie_raw = normalize(t.get('adresse_nom_voie', '') or '')
    voie_exp = expand_dvf(voie_raw)
    cp = t.get('code_postal', '') or ''
    surface = float(t['surface_reelle_bati'])

    # Pass 1: strict match (numero + cp + voie)
    sk = strict_key(numero, voie_exp, cp)
    if sk in strict_lookup:
        t['dpe_classe'] = strict_lookup[sk][0]
        strict_hits += 1
        continue

    # Pass 2: street-level fuzzy (cp + voie, pick by surface proximity)
    stk = street_key(voie_exp, cp)
    candidates = street_lookup.get(stk, [])
    if candidates:
        # Pick the candidate whose surface is closest to this transaction's surface
        best = min(candidates, key=lambda c: abs(c[2] - surface) if c[2] > 0 else 9999)
        if abs(best[2] - surface) <= surface * 0.25:  # within 25% surface
            t['dpe_classe'] = best[1]
            fuzzy_hits += 1

total = len(transactions)
with_surface = sum(1 for t in transactions if t.get('surface_reelle_bati'))
matched = strict_hits + fuzzy_hits

print(f"  {total} DVF transactions  |  {with_surface} with surface")
print(f"  Strict: {strict_hits}  |  Fuzzy: {fuzzy_hits}  |  Total: {matched} ({matched/with_surface*100:.1f}%)")

with open(OUT_PATH, 'w') as f:
    json.dump(transactions, f, ensure_ascii=False, separators=(',', ':'))
print(f"Saved → {OUT_PATH}")

from collections import Counter
dist = Counter(t.get('dpe_classe') for t in transactions if t.get('dpe_classe'))
print("DPE distribution:", dict(sorted(dist.items())))
