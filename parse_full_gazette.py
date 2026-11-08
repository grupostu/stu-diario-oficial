import pypdf
import re
import json

WORDS_TO_DIGIT = {
    'cero': '0', 'uno': '1', 'dos': '2', 'tres': '3', 'cuatro': '4',
    'cinco': '5', 'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9'
}

def extract_duis_from_text(text):
    duis = set()
    
    # 1. Words pattern
    pattern_words = r'\b(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s+(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s+(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s+(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s+(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s+(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s+(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s+(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s*[-–—\s]+\s*(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\b'
    for m in re.finditer(pattern_words, text, re.IGNORECASE):
        digits = [WORDS_TO_DIGIT[w.lower()] for w in m.groups()]
        duis.add("".join(digits[:8]) + "-" + digits[8])
        
    # 2. Digits pattern
    pattern_digits = r'(?:documento[^\d]{1,30}identidad[^\d]{1,15}|DUI[^\d]{0,10})\b(\d{8})[-–—\s]?(\d)\b'
    for m in re.finditer(pattern_digits, text, re.IGNORECASE):
        duis.add(f"{m.group(1)}-{m.group(2)}")
        
    # Generic standard 8-1 pattern
    for m in re.finditer(r'\b(\d{8})-(\d)\b', text):
        duis.add(f"{m.group(1)}-{m.group(2)}")
        
    return list(duis)

reader = pypdf.PdfReader(r"C:\Users\jovel\Downloads\23-10-2026.pdf")
records = []

# Process each page
for idx, page in enumerate(reader.pages):
    pageNum = idx + 1
    raw = page.extract_text()
    if not raw.strip():
        continue
        
    # Detect sections
    duis = extract_duis_from_text(raw)
    
    # Split page by edictos or carteles if multiple
    # Carteles typically end with "1 v. No. XXXXX" or "3 v. alt. No. XXXXX" or "v. No."
    chunks = re.split(r'(?=\b\d+\s+v\.\s+(?:alt\.\s+)?(?:No\.|cód\.|cod\.)\s+[A-Z0-9]+)', raw, flags=re.IGNORECASE)
    
    if len(chunks) <= 1:
        chunks = [raw]
        
    for c_idx, chunk in enumerate(chunks):
        cleaned = re.sub(r'\s+', ' ', chunk).strip()
        if len(cleaned) < 50:
            continue
            
        c_duis = extract_duis_from_text(cleaned)
        
        # Categorization
        cat = 'EDICTO_JUDICIAL'
        if pageNum <= 47:
            if 'DECRETO' in cleaned.upper():
                cat = 'DECRETO_LEGISLATIVO'
            elif 'MINISTERIO' in cleaned.upper() or 'ACUERDO' in cleaned.upper():
                cat = 'ACUERDO_EJECUTIVO'
        elif 'BALANCE' in cleaned.upper():
            cat = 'BALANCE_FINANCIERO'
        elif 'MARCA' in cleaned.upper() or 'DISTINTIVO' in cleaned.upper():
            cat = 'REGISTRO_MARCA'
            
        # Determine title
        lines = [l.strip() for l in chunk.split('\n') if l.strip() and len(l.strip()) > 5]
        titular = lines[0][:120] if lines else f"Publicación Oficial - Pág. {pageNum}"
        if "HACE SABER:" in titular:
            titular = lines[1][:120] if len(lines) > 1 else titular

        record = {
            "id": f"do-453-23102026-p{pageNum}-c{c_idx+1}",
            "tomo": 453,
            "numero": 198,
            "fecha": "2026-10-23",
            "pagina": pageNum,
            "categoria": cat,
            "seccion": "Carteles Oficiales y Edictos Judiciales" if pageNum >= 48 else "Órgano Legislativo / Ejecutivo",
            "titular": titular,
            "contenido": cleaned,
            "duisEncontrados": c_duis,
            "nitsEncontrados": [],
            "nombresClave": [],
            "pdfUrlOficial": f"https://www.diariooficial.gob.sv/diarios/2026/23-10-2026.pdf#page={pageNum}"
        }
        records.append(record)

print(f"Total structured records parsed: {len(records)}")

# Verify 00356274-2
p59_matches = [r for r in records if "00356274-2" in r["duisEncontrados"]]
print(f"Records containing 00356274-2: {len(p59_matches)}")
if p59_matches:
    print(f"Page: {p59_matches[0]['pagina']}")
    print(f"Titular: {p59_matches[0]['titular']}")
    print(f"DUIs: {p59_matches[0]['duisEncontrados']}")
    print(f"Snippet: {p59_matches[0]['contenido'][:200]}...")

# Save to JSON
with open(r"C:\Dev\Stu_Diario_Oficial\src\data_diario_real.json", "w", encoding="utf-8") as f:
    json.dump(records, f, indent=2, ensure_ascii=False)
print("Saved to C:\\Dev\\Stu_Diario_Oficial\\src\\data_diario_real.json")
