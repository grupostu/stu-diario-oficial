import type { CategoryType, DiarioRecord } from './types.js';

const WORDS_MAP: Record<string, string> = {
  cero: '0',
  uno: '1',
  dos: '2',
  tres: '3',
  cuatro: '4',
  cinco: '5',
  seis: '6',
  siete: '7',
  ocho: '8',
  nueve: '9'
};

/**
 * Normaliza cualquier entrada de DUI del usuario:
 * - 003562742 (9 dígitos seguidos)
 * - 00356274-2 (formato estándar con guion)
 * - 356274-2 (8 dígitos sin cero inicial -> padStart a 9 dígitos)
 * - 00356274 2 (separado por espacio)
 * - CERO CERO TRES CINCO SEIS DOS SIETE CUATRO - DOS (escrito en letras)
 */
export function normalizeDuiInput(input: string): { canonical: string; cleanDigits: string; isValidDui: boolean } {
  const trimmed = input.trim().toLowerCase();
  
  // 1. Detectar si viene en palabras
  const wordTokens = trimmed.match(/\b(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\b/gi);
  if (wordTokens && wordTokens.length >= 8) {
    let digits = wordTokens.map(w => WORDS_MAP[w.toLowerCase()]).join('');
    if (digits.length === 8) {
      digits = '0' + digits;
    }
    if (digits.length === 9) {
      const canonical = `${digits.slice(0, 8)}-${digits.slice(8)}`;
      return { canonical, cleanDigits: digits, isValidDui: true };
    }
  }

  // 2. Extraer dígitos numéricos
  let digits = trimmed.replace(/\D/g, '');

  // Si tiene entre 6 y 8 dígitos (típico cuando omiten los ceros iniciales en El Salvador), rellenar con 0s a la izquierda
  if (digits.length >= 6 && digits.length <= 8) {
    digits = digits.padStart(9, '0');
  }

  if (digits.length === 9) {
    const canonical = `${digits.slice(0, 8)}-${digits.slice(8)}`;
    return { canonical, cleanDigits: digits, isValidDui: true };
  }

  return { canonical: input.trim(), cleanDigits: digits, isValidDui: false };
}

/**
 * Extrae tanto DUIs en formato numérico (########-#) como DUIs escritos en letras
 * según la solemnidad notarial y judicial de El Salvador.
 */
export function extractDuis(text: string): string[] {
  const found = new Set<string>();

  // 1. DUIs estándar numéricos ########-#
  const numMatches = text.match(/\b\d{8}-\d\b/g) || [];
  for (const m of numMatches) {
    found.add(m);
  }

  // 2. DUIs precedidos por identificadores legales (DUI, documento único de identidad, etc.)
  const contextMatches = text.matchAll(/(?:documento[^\d]{1,35}identidad[^\d]{1,15}|DUI[^\d]{0,10})\b(\d{8})[-–—\s]?(\d)\b/gi);
  for (const cm of contextMatches) {
    if (cm[1] && cm[2]) {
      found.add(`${cm[1]}-${cm[2]}`);
    }
  }

  // 3. DUIs escritos en palabras (obligatorio en resoluciones judiciales salvadoreñas)
  // Ej: CERO CERO TRES CINCO SEIS DOS SIETE CUATRO - DOS
  const wordsRegex = /\b(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s+(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s+(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s+(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s+(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s+(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s+(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s+(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s*[-–—\s]+\s*(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\b/gi;
  
  const wordMatches = text.matchAll(wordsRegex);
  for (const wm of wordMatches) {
    const digits = [
      WORDS_MAP[wm[1].toLowerCase()],
      WORDS_MAP[wm[2].toLowerCase()],
      WORDS_MAP[wm[3].toLowerCase()],
      WORDS_MAP[wm[4].toLowerCase()],
      WORDS_MAP[wm[5].toLowerCase()],
      WORDS_MAP[wm[6].toLowerCase()],
      WORDS_MAP[wm[7].toLowerCase()],
      WORDS_MAP[wm[8].toLowerCase()],
      WORDS_MAP[wm[9].toLowerCase()]
    ].join('');
    found.add(`${digits.slice(0, 8)}-${digits.slice(8)}`);
  }

  return Array.from(found);
}

export function extractNits(text: string): string[] {
  const matches = text.match(/\b\d{4}-\d{6}-\d{3}-\d\b/g) || [];
  return Array.from(new Set(matches));
}

export function detectCategory(text: string): CategoryType {
  const lower = text.toLowerCase();
  if (lower.includes('marca') || lower.includes('nombre comercial') || lower.includes('distintivo') || lower.includes('clase internacional') || lower.includes('clase de niza') || lower.includes('propiedad intelectual')) {
    return 'REGISTRO_MARCA';
  }
  if (lower.includes('edicto') || lower.includes('rebeldía') || lower.includes('tribunal') || lower.includes('juzgado') || lower.includes('emplazamiento') || lower.includes('heredero') || lower.includes('sucesión') || lower.includes('herencia')) {
    return 'EDICTO_JUDICIAL';
  }
  if (lower.includes('decreto no') || lower.includes('asamblea legislativa')) {
    return 'DECRETO_LEGISLATIVO';
  }
  if (lower.includes('acuerdo no') || lower.includes('ramo de')) {
    return 'ACUERDO_EJECUTIVO';
  }
  if (lower.includes('subasta') || lower.includes('embargo') || lower.includes('remate público')) {
    return 'SUBASTA_EMBARGO';
  }
  if (lower.includes('balance') || lower.includes('estado de resultados') || lower.includes('auditoría') || lower.includes('sociedad anónima')) {
    return 'BALANCE_FINANCIERO';
  }
  return 'GENERAL';
}

export function parseRawEntry(
  rawText: string,
  meta: { tomo: number; numero: number; fecha: string; pagina: number; pdfUrl: string }
): DiarioRecord {
  const cleaned = rawText.replace(/\s+/g, ' ').trim();
  const duis = extractDuis(rawText);
  const nits = extractNits(cleaned);
  const categoria = detectCategory(cleaned);

  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const titular = lines[0]?.slice(0, 120) || `Publicación Oficial Pag. ${meta.pagina}`;

  return {
    id: `do-${meta.tomo}-${meta.numero}-p${meta.pagina}-${Math.random().toString(36).slice(2, 7)}`,
    tomo: meta.tomo,
    numero: meta.numero,
    fecha: meta.fecha,
    pagina: meta.pagina,
    categoria,
    seccion: categoria === 'EDICTO_JUDICIAL' ? 'Carteles Oficiales y Edictos Judiciales' : categoria === 'REGISTRO_MARCA' ? 'Registro de la Propiedad Intelectual' : 'Sección Oficial General',
    titular,
    contenido: cleaned,
    duisEncontrados: duis,
    nitsEncontrados: nits,
    nombresClave: [],
    pdfUrlOficial: meta.pdfUrl
  };
}
