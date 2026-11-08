import type { CategoryType, DiarioRecord, SearchResult } from './types.js';
import { classifyLegalRecord, duiToWords, normalizeDuiInput } from './parser.js';
import { avisoConsultaBusqueda } from './criterio.js';

/**
 * Pliega texto para comparar: minúsculas, sin acentos y con cualquier racha de espacios/saltos
 * de línea reducida a un espacio. Devuelve además el mapa posición plegada -> posición original.
 */
export function plegarTexto(texto: string): { plano: string; mapa: number[] } {
  let plano = '';
  const mapa: number[] = [];
  let espacioPrevio = true;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i]!;
    if (/\s/.test(ch)) {
      if (!espacioPrevio) {
        plano += ' ';
        mapa.push(i);
        espacioPrevio = true;
      }
      continue;
    }
    const base = ch.normalize('NFD')[0]!.toLowerCase().charAt(0) || ch;
    if (/[\u0300-\u036f]/.test(base)) continue;
    plano += base;
    mapa.push(i);
    espacioPrevio = false;
  }
  return { plano: plano.trimEnd(), mapa };
}

const VARIANTES: Record<string, string> = {
  a: 'aáàâäã', e: 'eéèêë', i: 'iíìîï', o: 'oóòôöõ', u: 'uúùûü', n: 'nñ', c: 'cç'
};

/** Patrón que ignora acentos, mayúsculas y diferencias de espacios/saltos de línea. */
export function patronTolerante(term: string): string {
  return plegarTexto(term)
    .plano.split('')
    .map((ch) => {
      if (ch === ' ') return '\\s+';
      const v = VARIANTES[ch];
      return v ? `[${v}]` : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('');
}

export class DiarioIndex {
  private plegados: Map<string, string> = new Map();
  private porId: Map<string, DiarioRecord> = new Map();
  private records: DiarioRecord[] = [];
  private duiIndex: Map<string, DiarioRecord[]> = new Map();
  private categoryIndex: Map<CategoryType, DiarioRecord[]> = new Map();

  addRecord(record: DiarioRecord): void {
    if (!record.clasificacionJuridica) {
      record.clasificacionJuridica = classifyLegalRecord(record.contenido + ' ' + record.titular, record.categoria);
    }
    this.records.push(record);
    this.porId.set(record.id, record);
    this.plegados.set(record.id, plegarTexto(`${record.titular} ${record.contenido}`).plano);

    // Index by category
    const catList = this.categoryIndex.get(record.categoria) || [];
    catList.push(record);
    this.categoryIndex.set(record.categoria, catList);

    // Index by each DUI found (both canonical 00000000-0 and raw digits 000000000)
    for (const dui of record.duisEncontrados) {
      const cleanDigits = dui.replace(/\D/g, '');
      const canonical = dui.includes('-') ? dui : `${cleanDigits.slice(0, 8)}-${cleanDigits.slice(8)}`;

      // Map clean digits
      const listDigits = this.duiIndex.get(cleanDigits) || [];
      if (!listDigits.some(r => r.id === record.id)) {
        listDigits.push(record);
      }
      this.duiIndex.set(cleanDigits, listDigits);

      // Map canonical
      const listCanonical = this.duiIndex.get(canonical) || [];
      if (!listCanonical.some(r => r.id === record.id)) {
        listCanonical.push(record);
      }
      this.duiIndex.set(canonical, listCanonical);
    }
  }

  addBatch(records: DiarioRecord[]): void {
    for (const r of records) {
      this.addRecord(r);
    }
  }

  search(query: string, categoryFilter?: string, forceDuiOnly?: boolean): SearchResult & { duiNormalized?: string; duiWords?: string; aviso?: string; entradaInvalida?: boolean } {
    const q = query.trim();
    if (!q) {
      return { total: 0, results: [], aviso: 'Escribe un DUI o un nombre para buscar en el archivo.', entradaInvalida: true };
    }

    const duiInfo = normalizeDuiInput(q);
    let matched: Array<{ diario: DiarioRecord; snippet: string; coincidenciaExacta: boolean }> = [];

    // 1. Si es búsqueda de DUI o el usuario forzó búsqueda por DUI
    if (duiInfo.isValidDui) {
      const fromCanonical = this.duiIndex.get(duiInfo.canonical) || [];
      const fromDigits = this.duiIndex.get(duiInfo.cleanDigits) || [];
      const combinedDuiRecords = Array.from(new Set([...fromCanonical, ...fromDigits]));

      for (const rec of combinedDuiRecords) {
        if (categoryFilter && rec.categoria !== categoryFilter) continue;
        matched.push({
          diario: rec,
          snippet: this.generateSnippet(rec.contenido, duiInfo.canonical, rec.pagina),
          coincidenciaExacta: true
        });
      }
    }

    // Si el usuario marcó explícitamente "Solo DUI" y encontramos coincidencias o es un DUI válido, retornar
    if (forceDuiOnly && duiInfo.isValidDui) {
      return {
        total: matched.length,
        results: matched,
        duiNormalized: duiInfo.canonical,
        duiWords: duiToWords(duiInfo.canonical)
      };
    }

    // 2. Búsqueda Full-Text insensible a acentos, mayúsculas y saltos de línea.
    //    Primero frase exacta; luego todas las palabras en cualquier orden (coincidencia parcial).
    const frase = plegarTexto(q).plano;
    const palabras = frase.split(' ').filter((w) => w.length >= 2);
    const frases: typeof matched = [];
    const parciales: typeof matched = [];
    // Con menos de 3 caracteres no se busca por texto (devolvería coincidencias sin sentido).
    for (const rec of q.length < 3 ? [] : this.records) {
      if (categoryFilter && rec.categoria !== categoryFilter) continue;
      if (matched.some((m) => m.diario.id === rec.id)) continue;
      const pajar = this.plegados.get(rec.id) ?? '';
      if (frase && pajar.includes(frase)) {
        frases.push({ diario: rec, snippet: this.generateSnippet(rec.contenido, q, rec.pagina), coincidenciaExacta: false });
      } else if (palabras.length > 1 && palabras.every((w) => pajar.includes(w))) {
        parciales.push({ diario: rec, snippet: this.generateSnippet(rec.contenido, palabras[0]!, rec.pagina), coincidenciaExacta: false });
      }
    }
    matched = [...matched, ...frases, ...parciales];

    let aviso: string | undefined;
    // La entrada es inválida (no es una consulta real): la interfaz debe mostrar el error
    // de validación y jamás «Sin publicaciones oficiales».
    // Etiquetas HTML, solo símbolos o «DUI» con letras (p. ej. abcdefgh-1) tampoco son consultas reales (R3-003).
    const avisoForma = avisoConsultaBusqueda(q);
    const entradaInvalida = duiInfo.incomplete || (duiInfo.isValidDui && duiInfo.checkDigitOk === false) || q.length < 3 || avisoForma !== null;
    if (duiInfo.incomplete) {
      aviso = 'El número escrito está incompleto: un DUI tiene 9 dígitos (8 más el dígito verificador). Complétalo para una búsqueda por DUI confiable.';
    } else if (duiInfo.isValidDui && duiInfo.checkDigitOk === false) {
      aviso = 'El dígito verificador de este DUI no es válido. Revisa que lo hayas escrito bien.';
    } else if (q.length < 3) {
      aviso = 'Escribe al menos 3 caracteres para buscar por nombre.';
    } else if (avisoForma) {
      aviso = avisoForma;
    }

    return {
      total: matched.length,
      results: matched,
      duiNormalized: duiInfo.isValidDui ? duiInfo.canonical : undefined,
      duiWords: duiInfo.isValidDui ? duiToWords(duiInfo.canonical) : undefined,
      aviso,
      entradaInvalida
    };
  }

  getRecentByCategory(category: CategoryType, limit = 10): DiarioRecord[] {
    const list = this.categoryIndex.get(category) || [];
    return list.slice(0, limit);
  }

  getById(id: string): DiarioRecord | undefined {
    return this.porId.get(id);
  }

  getAllRecords(): DiarioRecord[] {
    return this.records;
  }

  private generateSnippet(content: string, term: string, pagina = 1): string {
    const lower = content.toLowerCase();
    const cleanDigits = term.replace(/\D/g, '');
    const wordMap = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];

    let wordsRegexStr = '';
    if (cleanDigits.length === 9) {
      const wordsList = cleanDigits.split('').map(d => wordMap[parseInt(d, 10)] || d);
      wordsRegexStr = wordsList.slice(0, 8).join('\\s+') + '\\s*[-–—\\s]+\\s*' + wordsList[8];
    }

    // Posición insensible a acentos/saltos de línea (mapeada al texto original)
    const plegado = plegarTexto(content);
    const termPlano = plegarTexto(term).plano;
    let idx = lower.indexOf(term.toLowerCase());
    let matchLen = term.length;
    if (idx === -1 && termPlano) {
      const p = plegado.plano.indexOf(termPlano);
      if (p !== -1) {
        idx = plegado.mapa[p]!;
        const fin = plegado.mapa[Math.min(p + termPlano.length - 1, plegado.mapa.length - 1)]!;
        matchLen = fin - idx + 1;
      }
    }

    // Si no está el término exacto pero es DUI, buscar los dígitos o palabras en letras
    if (idx === -1 && cleanDigits.length === 9) {
      idx = lower.indexOf(cleanDigits);
      if (idx !== -1) {
        matchLen = cleanDigits.length;
      } else if (wordsRegexStr) {
        try {
          const wm = content.match(new RegExp(wordsRegexStr, 'i'));
          if (wm && wm.index !== undefined) {
            idx = wm.index;
            matchLen = wm[0].length;
          }
        } catch {
          // ignore
        }
      }
      if (idx === -1) {
        idx = lower.indexOf('documento');
        if (idx === -1) idx = lower.indexOf('identidad');
        if (idx === -1) idx = 0;
        matchLen = 25;
      }
    }

    if (idx === -1) {
      idx = 0;
    }

    const start = Math.max(0, idx - 110);
    const end = Math.min(content.length, idx + matchLen + 160);
    const slice = content.slice(start, end);

    const escapedTerm = patronTolerante(term);
    const patterns = [
      escapedTerm,
      cleanDigits.length === 9 ? cleanDigits : null,
      wordsRegexStr ? wordsRegexStr : null
    ].filter(Boolean);

    const safeTermAttr = term.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    try {
      const regex = new RegExp(`(${patterns.join('|')})`, 'gi');
      return (
        (start > 0 ? '...' : '') +
        slice.replace(
          regex,
          `<mark onclick="openEbookViewer(${pagina}, '${safeTermAttr}')" title="Clic para abrir el Visor Ebook en Pág. ${pagina} y resaltar en el PDF original" class="highlight-clickable bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-1.5 py-0.5 rounded cursor-pointer shadow-sm transition-all">$1</mark>`
        ) +
        (end < content.length ? '...' : '')
      );
    } catch {
      return (start > 0 ? '...' : '') + slice + (end < content.length ? '...' : '');
    }
  }

  count(): number {
    return this.records.length;
  }
}
