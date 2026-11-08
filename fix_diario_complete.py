import json
import os
import re

ROOT = r"C:\Dev\Stu_Diario_Oficial"
DATA_PATH = os.path.join(ROOT, "src", "data_diario_real.json")
VIEWS_PATH = os.path.join(ROOT, "src", "views.ts")
GRAPHICS_DIR = os.path.join(ROOT, "public", "assets", "graphics")
os.makedirs(GRAPHICS_DIR, exist_ok=True)

# 1. RE-CURAR data_diario_real.json: unir introducciones de Juez/Notario con su cuerpo "HACE SABER:"
with open(DATA_PATH, "r", encoding="utf-8") as f:
    records = json.load(f)

merged_records = []
i = 0
while i < len(records):
    curr = dict(records[i])
    # Si este registro es corto (< 420 chars) y el siguiente registro está en la misma página y empieza con "HACE SABER"
    if i + 1 < len(records):
        nxt = records[i + 1]
        if (
            curr.get("pagina") == nxt.get("pagina")
            and len(curr.get("contenido", "")) < 480
            and ("HACE SABER" in nxt.get("contenido", "")[:60].upper())
        ):
            combined_text = curr["contenido"].strip() + "\n\n" + nxt["contenido"].strip()
            curr["contenido"] = combined_text
            # Combinar DUIs sin duplicados
            duis = []
            for d in (curr.get("duisEncontrados") or []) + (nxt.get("duisEncontrados") or []):
                if d not in duis:
                    duis.append(d)
            curr["duisEncontrados"] = duis
            # Mejorar el titular para que muestre claramente el causante/persona y el Juez/Notario
            m_causante = re.search(
                r"(?:causante|señor[a]?|sucesión de[l]?[:\s]+|dejó a su defunción (?:el|la) señor[a]?)\s+([A-ZÁÉÍÓÚÑ\s]{6,55})",
                combined_text,
            )
            if m_causante:
                nombre_c = " ".join(m_causante.group(1).split())[:50].strip(" ,.;:")
                curr["titular"] = f"Edicto de Sucesión / Herencia · Causante: {nombre_c} (Pág. {curr['pagina']})"
            elif nxt.get("titular") and "Sucesión" in nxt.get("titular", ""):
                curr["titular"] = nxt["titular"]
            i += 2
            merged_records.append(curr)
            continue
    # Mejorar titulares genéricos "Autoridad Judicial (Edicto #XX)"
    if "Autoridad Judicial" in curr.get("titular", ""):
        txt = curr.get("contenido", "")
        m_person = re.search(
            r"(?:señor[a]?|causante|favor de|contra)\s+([A-ZÁÉÍÓÚÑ]{3,}(?:\s+[A-ZÁÉÍÓÚÑ]{2,}){1,5})",
            txt,
        )
        if m_person:
            nom = " ".join(m_person.group(1).split())
            curr["titular"] = f"Publicación Judicial / Notarial · {nom} (Pág. {curr['pagina']})"
    merged_records.append(curr)
    i += 1

with open(DATA_PATH, "w", encoding="utf-8") as f:
    json.dump(merged_records, f, ensure_ascii=False, indent=2)

print(f"[+] data_diario_real.json depurado: {len(records)} -> {len(merged_records)} edictos íntegros sin fragmentos partidos.")

# 2. REEMPLAZAR SVGs INFANTILES POR DISEÑO VECTORIAL FINO E INSTITUCIONAL
clean_shield_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="56" height="56" rx="14" fill="#090d16" stroke="url(#g1)" stroke-width="1.5"/>
  <path d="M32 14L46 20V31C46 41.2 39.8 49.4 32 52C24.2 49.4 18 41.2 18 31V20L32 14Z" fill="#0f172a" stroke="url(#g1)" stroke-width="1.75"/>
  <path d="M26 32L30 36L39 27" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>"""

for svg_name in [
    "sello-laip-dominio-publico.svg",
    "escudo-soberania-documental.svg",
    "sello-certificacion-stu.svg",
    "icono-sincronizacion-pdf.svg",
    "icono-detector-dui.svg",
]:
    with open(os.path.join(GRAPHICS_DIR, svg_name), "w", encoding="utf-8") as f:
        f.write(clean_shield_svg)

print("[+] SVGs institucionales limpios actualizados.")

# 3. PARCHEAR views.ts CON PRECISION PIXEL-EXACT EN PDF.JS, SCROLL LIBRE, ARTICULOS CLICABLES Y BLINDAJE LEGAL
with open(VIEWS_PATH, "r", encoding="utf-8") as f:
    v = f.read()

# A) Corregir CSS de #pdf-page-wrapper para que Flexbox JAMÁS comprima la altura del canvas
v = v.replace(
    """    #pdf-page-wrapper {
      position: relative;
      margin: 0 auto;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.85);
      border-radius: 10px;
      overflow: hidden;
      background: #ffffff;
      transition: transform 0.25s ease;
    }""",
    """    #pdf-page-wrapper {
      position: relative;
      margin: 0 auto 32px auto;
      flex-shrink: 0;
      display: inline-block;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.85);
      border-radius: 8px;
      background: #ffffff;
    }
    #pdf-interactive-scroll-container {
      overflow-y: auto !important;
      overflow-x: auto !important;
      max-height: calc(100vh - 68px);
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      cursor: grab;
    }
    #pdf-interactive-scroll-container:active {
      cursor: grabbing;
    }"""
)

# B) Corregir typo en el id del contenedor de scroll y eliminar flex-col que aplastaba el canvas
v = v.replace(
    '<div id="pdf- interactive-scroll-container" class="flex-1 bg-slate-950/95 overflow-auto p-3 sm:p-6 border-r border-slate-800 relative flex flex-col items-center">',
    '<div id="pdf-interactive-scroll-container" class="flex-1 bg-slate-950/95 overflow-y-auto overflow-x-auto p-3 sm:p-6 border-r border-slate-800 relative text-center">'
)

# C) Blindaje Legal: Reemplazar "Ficha Certificada de Citación Legal" por "Nota de Referencia Bibliográfica (Uso Informativo)"
v = v.replace('Ficha Certificada de Citación Legal (Imprimir / Copiar)', 'Nota Informativa de Referencia Bibliográfica (Sin Valor Certificante)')
v = v.replace('<span class="hidden md:inline">Ficha Certificada Legal</span>', '<span class="hidden md:inline">Referencia Bibliográfica</span>')
v = v.replace('<h3 class="text-base sm:text-lg font-black text-white">Ficha Certificada de Citación Legal</h3>', '<h3 class="text-base sm:text-lg font-black text-white">Nota Informativa de Referencia Bibliográfica</h3>')
v = v.replace('<p class="text-[11px] font-mono text-amber-300">Formato Oficial para Escritos Judiciales y Notariales en El Salvador</p>', '<p class="text-[11px] font-mono text-amber-300">Guía Auxiliar de Ubicación (Tomo / Página) · Sin Valor Certificante Oficial</p>')
v = v.replace('Copiar Ficha Legal Completa', 'Copiar Referencia Bibliográfica')
v = v.replace('Imprimir Constancia', 'Imprimir Nota Informativa')
v = v.replace("alert('✔ Ficha Certificada de Citación Legal copiada íntegramente al portapapeles.');", "showFloatingRadar('✔ Nota informativa de referencia copiada al portapapeles');")

# D) Reemplazar openCertifiedCitationModal() con Descargo Legal Estricto y contextualizado al artículo activo
old_modal_fn = """    function openCertifiedCitationModal() {
      const modal = document.getElementById('modal-certified-citation');
      const body = document.getElementById('certified-citation-body');
      const firstRec = currentPageRecords[0];
      const clasif = firstRec ? classifyLegalRecordJS(firstRec) : 'Publicación Oficial Gubernamental';
      const duisList = currentPageRecords.flatMap(r => r.duisEncontrados || []);
      body.innerHTML = `
        <div class="text-amber-400 font-bold border-b border-slate-800 pb-1.5 mb-2">CERTIFICACIÓN DE REFERENCIA HEBDO-DOCUMENTAL (LAIP ARTS. 10 Y 11)</div>
        <div><strong>Órgano / Fuente Oficial:</strong> Diario Oficial de la República de El Salvador (Imprenta Nacional)</div>
        <div><strong>Datos de Edición:</strong> Tomo N° 453 · Diario N° 198 · Fecha: 23 de Octubre de 2026</div>
        <div><strong>Ubicación Exacta:</strong> Página <strong>${currentEbookPage} de 164</strong></div>
        <div><strong>Clasificación Jurídica:</strong> ${clasif}</div>
        <div><strong>Término / DUI Verificado:</strong> ${currentHighlightedTerm || (duisList.length ? duisList.join(', ') : 'Consulta General de Hoja')}</div>
        <div><strong>URL Primaria Estatal:</strong> https://www.diariooficial.gob.sv/</div>
        <div class="text-[11px] text-emerald-400 pt-2 border-t border-slate-800">✔ Copia fiel digitalizada y sincronizada mediante índice O(1) de Grupo Stu, S.A.S.</div>
      `;
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }"""

new_modal_fn = """    let activeArticleIndex = 0;
    function openCertifiedCitationModal(recordIdx) {
      if (typeof recordIdx === 'number') activeArticleIndex = recordIdx;
      const modal = document.getElementById('modal-certified-citation');
      const body = document.getElementById('certified-citation-body');
      const rec = currentPageRecords[activeArticleIndex] || currentPageRecords[0];
      const clasif = rec ? classifyLegalRecordJS(rec) : 'Publicación del Diario Oficial';
      const titular = rec ? rec.titular : 'Consulta de Página ' + currentEbookPage;
      const duisList = rec && rec.duisEncontrados ? rec.duisEncontrados : [];
      body.innerHTML = `
        <div class="text-amber-400 font-bold border-b border-slate-800 pb-1.5 mb-2">NOTA AUXILIAR DE UBICACIÓN BIBLIOGRÁFICA (USO EXCLUSIVAMENTE INFORMATIVO)</div>
        <div><strong>Fuente Estatal Originaria:</strong> Diario Oficial de El Salvador (Imprenta Nacional · diariooficial.gob.sv)</div>
        <div><strong>Datos de Edición:</strong> Tomo N° 453 · Diario N° 198 · Fecha: 23 de Octubre de 2026</div>
        <div><strong>Ubicación en Ejemplar:</strong> Página <strong>${currentEbookPage} de 164</strong></div>
        <div><strong>Artículo / Edicto Seleccionado:</strong> ${titular} (${clasif})</div>
        <div><strong>Criterio / DUI en este Edicto:</strong> ${currentHighlightedTerm || (duisList.length ? duisList.join(', ') : 'Ningún DUI asociado a este edicto específico')}</div>
        <div class="mt-3 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[10px] text-amber-200/90 leading-relaxed">
          <strong>DESCARGO LEGAL IMPORTANTE (TÉRMINOS Y CONDICIONES):</strong> Este resumen es una guía informática de ubicación bibliográfica generada por software privado de <strong>Grupo Stu, S.A.S.</strong> <u>NO constituye certificación, constancia oficial, copia fiel ni documento público</u> (facultad exclusiva de la Imprenta Nacional o funcionarios/notarios autorizados por ley). El texto indexado proviene de lectura óptica automatizada (OCR) y puede contener imprecisiones. <strong>Grupo Stu, S.A.S. no asume responsabilidad alguna por la información contenida ni por el uso, interpretación o decisiones que el usuario o terceros tomen con base en la misma.</strong> Verifique siempre el documento original estatal.
        </div>
      `;
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }"""

if old_modal_fn in v:
    v = v.replace(old_modal_fn, new_modal_fn)

# E) Reemplazar el bloque de Sello LAIP inferior con Términos, Condiciones y Descargo Total de Responsabilidad Legal
old_laip_box = """    <!-- Escudo y Blindaje Legal (LAIP Arts. 10 y 11) -->
    <div class="mt-8 p-6 rounded-2xl border border-slate-800 bg-slate-950/70 text-xs text-slate-400 leading-relaxed text-left flex flex-col md:flex-row items-center gap-5">
      <img src="/assets/graphics/sello-laip-dominio-publico.svg" alt="Sello LAIP" class="w-20 h-20 shrink-0">
      <div>
        <div class="flex items-center gap-2 text-slate-200 font-bold mb-1.5">
          <i class="fa-solid fa-scale-balanced text-brand-400"></i>
          <span>Marco Jurídico de Transparencia, Dominio Público y Blindaje Institucional</span>
        </div>
        <p>
          <strong>1. Pleno Dominio Público (LAIP Arts. 10 y 11):</strong> De conformidad con los Artículos 10 y 11 de la <em>Ley de Acceso a la Información Pública</em> de El Salvador, las leyes, decretos, reglamentos, edictos judiciales, carteles notariales y resoluciones divulgados en el Diario Oficial tienen el carácter legal de <strong>información oficiosa de libre consulta y de pleno dominio público</strong>.
        </p>
        <p class="mt-1.5">
          <strong>2. Independencia Tecnológica:</strong> Esta plataforma es un servicio independiente de indexación, analítica y monitoreo cívico desarrollado y operado por <strong>Grupo Stu, S.A.S.</strong> La fuente originaria es accesible en <code>diariooficial.gob.sv</code> e <code>imprentanacional.gob.sv</code>.
        </p>
      </div>
    </div>"""

new_laip_box = """    <!-- Marco Legal, Términos y Condiciones y Descargo de Responsabilidad de Grupo Stu, S.A.S. -->
    <div class="mt-8 p-6 rounded-2xl border border-slate-800/90 bg-slate-950/85 text-xs text-slate-400 leading-relaxed text-left space-y-3">
      <div class="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2.5">
        <div class="flex items-center gap-2.5 text-slate-100 font-bold">
          <span class="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <i class="fa-solid fa-scale-balanced"></i>
          </span>
          <span>Términos de Uso, Naturaleza Informativa y Descargo Legal de Responsabilidad — Grupo Stu, S.A.S.</span>
        </div>
        <span class="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">Cumplimiento LAIP Arts. 10 y 11 · Uso Informativo</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
        <div class="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/70">
          <strong class="text-white block mb-1">1. Información Pública Oficiosa (LAIP):</strong>
          De conformidad con los Arts. 10 y 11 de la <em>Ley de Acceso a la Información Pública</em> de El Salvador, las publicaciones del Diario Oficial son información de libre acceso y dominio público. Este portal facilita su búsqueda tecnológica.
        </div>
        <div class="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/70">
          <strong class="text-white block mb-1">2. No Sustitución ni Carácter Certificante:</strong>
          <strong>Grupo Stu, S.A.S.</strong> es una entidad privada e independiente; no representa ni sustituye a la Imprenta Nacional (<code>diariooficial.gob.sv</code>) ni emite certificaciones, constancias oficiales o copias fieles con valor probatorio judicial.
        </div>
        <div class="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/70">
          <strong class="text-amber-300 block mb-1">3. Limitación Total de Responsabilidad:</strong>
          Las transcripciones provienen de procesos automatizados (OCR) y se ofrecen «tal cual» con fines orientativos. <strong>Grupo Stu, S.A.S. no es responsable de la exactitud de la información contenida ni del uso, interpretación o decisiones tomadas por el usuario.</strong>
        </div>
      </div>
    </div>"""

if old_laip_box in v:
    v = v.replace(old_laip_box, new_laip_box)

# F) Reemplazar el motor de resaltado en el PDF para usar coordenadas EXACTAS de viewport.convertToViewportRectangle sobre el canvas
old_pdf_engine = """        // Construir capa de texto superpuesta (textLayer)
        textLayerDiv.innerHTML = '';
        textLayerDiv.style.width = Math.floor(viewport.width) + 'px';
        textLayerDiv.style.height = Math.floor(viewport.height) + 'px';
        textLayerDiv.style.setProperty('--scale-factor', String(currentPdfScale));

        const textContent = await page.getTextContent();
        await window.pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport: viewport,
          textDivs: []
        }).promise;

        loadingOverlay.classList.add('hidden');
        wrapper.classList.remove('hidden');

        // Aplicar remarcado fluorescente en el PDF y sincronizar clic inverso (PDF -> Transcripción)
        applyHighlightsOnPdfTextLayer(currentHighlightedTerm, autoFocusHighlight);"""

new_pdf_engine = """        // Construir capa de coordenadas matemática 1:1 con el canvas usando viewport.convertToViewportRectangle
        textLayerDiv.innerHTML = '';
        textLayerDiv.style.width = Math.floor(viewport.width) + 'px';
        textLayerDiv.style.height = Math.floor(viewport.height) + 'px';

        const textContent = await page.getTextContent();
        window.__lastPdfTextItems = textContent.items || [];
        window.__lastPdfViewport = viewport;

        // Crear elementos posicionados con exactitud matemática milimétrica sobre cada línea del PDF
        (textContent.items || []).forEach((item, idx) => {
          if (!item.str || !item.str.trim()) return;
          const tx = item.transform; // [scaleX, skewY, skewX, scaleY, x, y]
          const fontHeight = Math.hypot(tx[2], tx[3]) || 10;
          const itemWidth = item.width || (item.str.length * fontHeight * 0.5);
          // En PDF las coordenadas (tx[4], tx[5]) son el origen inferior izquierdo de la línea de texto
          const rect = viewport.convertToViewportRectangle([
            tx[4],
            tx[5] - fontHeight * 0.18,
            tx[4] + itemWidth,
            tx[5] + fontHeight * 0.92
          ]);
          const left = Math.min(rect[0], rect[2]);
          const top = Math.min(rect[1], rect[3]);
          const width = Math.max(12, Math.abs(rect[2] - rect[0]));
          const height = Math.max(10, Math.abs(rect[3] - rect[1]));

          const span = document.createElement('span');
          span.textContent = item.str;
          span.dataset.itemIdx = String(idx);
          span.style.position = 'absolute';
          span.style.left = Math.round(left) + 'px';
          span.style.top = Math.round(top) + 'px';
          span.style.width = Math.round(width) + 'px';
          span.style.height = Math.round(height) + 'px';
          span.style.color = 'transparent';
          span.style.userSelect = 'text';
          span.style.pointerEvents = 'auto';
          textLayerDiv.appendChild(span);
        });

        loadingOverlay.classList.add('hidden');
        wrapper.classList.remove('hidden');

        // Aplicar remarcado fluorescente exacto en el PDF
        applyHighlightsOnPdfTextLayer(currentHighlightedTerm, autoFocusHighlight);"""

if old_pdf_engine in v:
    v = v.replace(old_pdf_engine, new_pdf_engine)

# G) Mejorar buildSearchTokensForPdf para NO generar sub-secuencias falsas ("uno siete") y coincidir con precisión
old_tokens_fn = """      // Si es un DUI (8 o 9 dígitos), agregar tanto formato numérico como secuencia de palabras notariales
      if (digits.length >= 7 && digits.length <= 9) {
        const padded = digits.padStart(9, '0');
        const canonical = padded.slice(0, 8) + '-' + padded.slice(8);
        tokens.add(canonical);
        tokens.add(padded);
        const wordsStr = duiToNotarialWordsJS(canonical).toLowerCase();
        tokens.add(wordsStr);
        // Agregar sub-secuencias de 3 y 4 palabras consecutivas del DUI para capturar líneas partidas en columnas del PDF
        const wArr = padded.split('').map(d => DIGIT_WORDS[parseInt(d, 10)].toLowerCase());
        for (let i = 0; i <= wArr.length - 3; i++) {
          tokens.add(wArr.slice(i, i + 3).join(' '));
        }
        tokens.add(wArr[7] + ' - ' + wArr[8]);
        tokens.add(wArr[7] + ' ' + wArr[8]);
      } else {"""

new_tokens_fn = """      // Si es un DUI (8 o 9 dígitos), agregar formato numérico y secuencias de al menos 4 palabras del DUI
      if (digits.length >= 7 && digits.length <= 9) {
        const padded = digits.padStart(9, '0');
        const canonical = padded.slice(0, 8) + '-' + padded.slice(8);
        tokens.add(canonical);
        tokens.add(padded);
        const wordsStr = duiToNotarialWordsJS(canonical).toLowerCase();
        tokens.add(wordsStr);
        const wArr = padded.split('').map(d => DIGIT_WORDS[parseInt(d, 10)].toLowerCase());
        for (let i = 0; i <= wArr.length - 4; i++) {
          tokens.add(wArr.slice(i, i + 4).join(' '));
        }
        tokens.add(wArr.slice(5, 8).join(' ') + ' - ' + wArr[8]);
      } else {"""

if old_tokens_fn in v:
    v = v.replace(old_tokens_fn, new_tokens_fn)

# H) Hacer que TODAS las tarjetas de artículos a la derecha sean 100% interactivas y clicables para saltar a ese artículo en el PDF
old_cards_fn = """      transBox.innerHTML = records.map(rec => {
        const clasif = classifyLegalRecordJS(rec);
        const highlightedContent = buildInteractiveHighlightedHtml(rec.contenido, currentHighlightedTerm, rec.pagina);
        const duisChips = (rec.duisEncontrados && rec.duisEncontrados.length > 0)
          ? '<div class="pt-2.5 border-t border-slate-800/90 flex flex-wrap items-center gap-1.5">' +
              '<span class="text-[10px] text-amber-400 font-bold"><i class="fa-solid fa-fingerprint mr-1"></i>DUIs Identificados (Clic para enfocar en PDF):</span>' +
              rec.duisEncontrados.map(d => {
                const w = duiToNotarialWordsJS(d);
                return `<button type="button" onclick="focusTermInPdfFromTranscription('${d}', ${rec.pagina})" title="Clic para localizar y enfocar en el PDF original: ${w}"
                  class="px-2 py-0.5 rounded bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/40 text-[11px] font-black transition-all cursor-pointer">
                  ${d} <i class="fa-solid fa-location-crosshairs ml-0.5 text-[10px]"></i>
                </button>`;
              }).join('') +
            '</div>'
          : '';

        return `
          <div class="ebook-record-card p-4 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 transition-all text-left space-y-2.5">
            <div class="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-800 pb-2">
              ${getLegalClassificationBadge(clasif)}
              <span class="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Tomo ${rec.tomo} · N° ${rec.numero} · Pág. ${rec.pagina} de 164
              </span>
            </div>
            <h6 class="font-bold text-white text-xs leading-snug">${rec.titular}</h6>
            <div class="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line">${highlightedContent}</div>
            ${duisChips}
          </div>`;
      }).join('');"""

new_cards_fn = """      transBox.innerHTML = '<div class="text-[11px] bg-brand-950/40 border border-brand-500/30 text-brand-300 px-3 py-2 rounded-xl mb-3 flex items-center justify-between">' +
        '<span><i class="fa-solid fa-hand-pointer mr-1.5"></i><strong>' + records.length + ' artículos en esta página:</strong> Haz clic en cualquier tarjeta para enfocar ese edicto en el PDF</span>' +
        '</div>' +
        records.map((rec, idx) => {
        const clasif = classifyLegalRecordJS(rec);
        const highlightedContent = buildInteractiveHighlightedHtml(rec.contenido, currentHighlightedTerm, rec.pagina);
        // Extraer una frase ancla única del artículo para que al hacer clic en la tarjeta salte exactamente a ese artículo en el PDF
        const cleanLines = (rec.contenido || '').split(/\\n+/).map(l => l.trim()).filter(l => l.length > 18);
        const anchorPhrase = (cleanLines[0] || rec.titular || '').slice(0, 38).replace(/'/g, "\\\\'");
        const duisChips = (rec.duisEncontrados && rec.duisEncontrados.length > 0)
          ? '<div class="pt-2.5 border-t border-slate-800/90 flex flex-wrap items-center gap-1.5" onclick="event.stopPropagation()">' +
              '<span class="text-[10px] text-amber-400 font-bold"><i class="fa-solid fa-fingerprint mr-1"></i>DUIs en este edicto (Clic para enfocar):</span>' +
              rec.duisEncontrados.map(d => {
                const w = duiToNotarialWordsJS(d);
                return `<button type="button" onclick="focusTermInPdfFromTranscription('${d}', ${rec.pagina})" title="Localizar en el PDF: ${w}"
                  class="px-2 py-0.5 rounded bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/40 text-[11px] font-black transition-all cursor-pointer">
                  ${d} <i class="fa-solid fa-location-crosshairs ml-0.5 text-[10px]"></i>
                </button>`;
              }).join('') +
            '</div>'
          : '';

        return `
          <div onclick="selectArticleCardAndFocusPdf(${idx}, '${anchorPhrase}', ${rec.pagina})" id="ebook-article-card-${idx}"
            class="ebook-record-card cursor-pointer p-4 rounded-2xl bg-slate-950/90 border ${idx === activeArticleIndex ? 'border-brand-500 ring-1 ring-brand-500/40' : 'border-slate-800 hover:border-cyan-500/60'} transition-all text-left space-y-2.5 group">
            <div class="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-800 pb-2">
              <div class="flex items-center gap-1.5">
                <span class="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px] font-bold">Artículo #${idx + 1}</span>
                ${getLegalClassificationBadge(clasif)}
              </div>
              <button type="button" onclick="event.stopPropagation(); selectArticleCardAndFocusPdf(${idx}, '${anchorPhrase}', ${rec.pagina})"
                class="text-[10px] font-mono font-bold text-slate-950 bg-brand-400 hover:bg-brand-300 px-2.5 py-0.5 rounded-md transition-all flex items-center gap-1">
                <i class="fa-solid fa-crosshairs"></i> Ver en PDF
              </button>
            </div>
            <h6 class="font-bold text-white group-hover:text-brand-300 transition-colors text-xs leading-snug">${rec.titular}</h6>
            <div class="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line">${highlightedContent}</div>
            ${duisChips}
            <div class="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400" onclick="event.stopPropagation()">
              <button type="button" onclick="copyCitation(currentPageRecords[${idx}].contenido)" class="hover:text-white flex items-center gap-1"><i class="fa-regular fa-copy text-cyan-400"></i> Copiar texto del edicto</button>
              <button type="button" onclick="openCertifiedCitationModal(${idx})" class="hover:text-amber-300 flex items-center gap-1"><i class="fa-solid fa-book-bookmark text-amber-400"></i> Nota de Referencia</button>
            </div>
          </div>`;
      }).join('');"""

if old_cards_fn in v:
    v = v.replace(old_cards_fn, new_cards_fn)

helper_fn = """    function selectArticleCardAndFocusPdf(idx, anchorPhrase, pageNum) {
      activeArticleIndex = idx;
      document.querySelectorAll('.ebook-record-card').forEach((el, i) => {
        if (i === idx) {
          el.classList.add('border-brand-500', 'ring-1', 'ring-brand-500/40');
        } else {
          el.classList.remove('border-brand-500', 'ring-1', 'ring-brand-500/40');
        }
      });
      const rec = currentPageRecords[idx];
      // Si el artículo tiene un DUI propio o un término activo, o usamos las palabras clave del titular/inicio del artículo
      let focusTarget = currentHighlightedTerm;
      if (!focusTarget || (rec && !rec.contenido.toLowerCase().includes(focusTarget.toLowerCase()))) {
        if (rec && rec.duisEncontrados && rec.duisEncontrados.length > 0) {
          focusTarget = rec.duisEncontrados[0];
        } else {
          focusTarget = anchorPhrase.split(/\s+/).slice(0, 4).join(' ');
        }
      }
      focusTermInPdfFromTranscription(focusTarget, pageNum);
    }
"""

if "function selectArticleCardAndFocusPdf(" not in v:
    v = v.replace("    function renderTranscriptionCards(records) {", helper_fn + "\n    function renderTranscriptionCards(records) {")

with open(VIEWS_PATH, "w", encoding="utf-8") as f:
    f.write(v)

print("[+] views.ts actualizado con coordenadas exactas de PDF.js, scroll libre, artículos interactivos y descargo legal.")
