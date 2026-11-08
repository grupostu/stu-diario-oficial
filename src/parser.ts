import { DIGIT_WORD_RE, extractCardinalDuis } from './dui_words.js';
import type { CategoryType, DiarioRecord, LegalClassification } from './types.js';

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

const DIGIT_TO_WORD: string[] = [
  'CERO',
  'UNO',
  'DOS',
  'TRES',
  'CUATRO',
  'CINCO',
  'SEIS',
  'SIETE',
  'OCHO',
  'NUEVE'
];

/**
 * Convierte un DUI canónico (00356274-2) a su representación notarial en palabras:
 * "CERO CERO TRES CINCO SEIS DOS SIETE CUATRO - DOS"
 */
export function duiToWords(dui: string): string {
  const digits = dui.replace(/\D/g, '');
  if (digits.length !== 9) return dui;
  const first8 = digits
    .slice(0, 8)
    .split('')
    .map((d) => DIGIT_TO_WORD[parseInt(d, 10)] || d)
    .join(' ');
  const last1 = DIGIT_TO_WORD[parseInt(digits[8]!, 10)] || digits[8];
  return `${first8} - ${last1}`;
}

/**
 * Normaliza cualquier entrada de DUI del usuario:
 * - 003562742 (9 dígitos seguidos)
 * - 00356274-2 (formato estándar con guion)
 * - 356274-2 (8 dígitos sin cero inicial -> padStart a 9 dígitos)
 * - 00356274 2 (separado por espacio)
 * - CERO CERO TRES CINCO SEIS DOS SIETE CUATRO - DOS (escrito en letras)
 */
export function normalizeDuiInput(input: string): {
  canonical: string;
  cleanDigits: string;
  isValidDui: boolean;
  incomplete?: boolean;
  checkDigitOk?: boolean;
} {
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
      return { canonical, cleanDigits: digits, isValidDui: true, checkDigitOk: validarDigitoDui(digits) };
    }
  }

  // 2. Extraer dígitos numéricos
  let digits = trimmed.replace(/\D/g, '');

  // Solo se rellenan ceros iniciales cuando el usuario separó el dígito verificador ("356274-2"):
  // sin separador, 6 a 8 dígitos es un DUI incompleto y NO se inventan dígitos.
  const conSeparador = /^\s*\d{1,8}\s*[-–—\s]\s*\d\s*$/.test(trimmed);
  if (conSeparador && digits.length >= 6 && digits.length <= 8) {
    digits = digits.padStart(9, '0');
  }

  if (digits.length === 9) {
    const canonical = `${digits.slice(0, 8)}-${digits.slice(8)}`;
    return { canonical, cleanDigits: digits, isValidDui: true, checkDigitOk: validarDigitoDui(digits) };
  }

  const incomplete = digits.length >= 6 && digits.length <= 8 && /^[\d\s\-–—]+$/.test(trimmed);
  return { canonical: input.trim(), cleanDigits: digits, isValidDui: false, incomplete };
}

/** Valida el dígito verificador del DUI salvadoreño (módulo 10 con pesos 9..2). */
export function validarDigitoDui(digits9: string): boolean {
  if (!/^\d{9}$/.test(digits9)) return false;
  let suma = 0;
  for (let i = 0; i < 8; i++) suma += Number(digits9[i]) * (9 - i);
  return (10 - (suma % 10)) % 10 === Number(digits9[8]);
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
  // La forma verbal no debe ser parte de una racha más larga de palabras-dígito (p. ej. una matrícula
  // registral "NUEVE CERO UNO ... TRES-CERO CERO CERO CERO CERO" no es un DUI).
  const wordsRegex = new RegExp(
    String.raw`(?<!${DIGIT_WORD_RE}\s+)\b(${DIGIT_WORD_RE})(?:\s+(${DIGIT_WORD_RE})){7}\s*[-–—\s]+\s*(${DIGIT_WORD_RE})\b(?!\s+${DIGIT_WORD_RE}\b)`,
    'gi'
  );

  for (const wm of text.matchAll(wordsRegex)) {
    const words = wm[0].toLowerCase().match(new RegExp(DIGIT_WORD_RE, 'g')) || [];
    const digits = words.map((w) => WORDS_MAP[w]).join('');
    if (digits.length === 9) found.add(`${digits.slice(0, 8)}-${digits.slice(8)}`);
  }

  // 4. DUIs en forma cardinal ("cero dos millones treinta y seis mil ... - ocho")
  for (const c of extractCardinalDuis(text)) found.add(c);

  return Array.from(found);
}

export function extractNits(text: string): string[] {
  // Tolera saltos de línea y espacios alrededor de los guiones (texto OCR de columnas angostas)
  const matches = text.match(/\b\d{4}\s*-\s*\d{6}\s*-\s*\d{3}\s*-\s*\d\b/g) || [];
  return Array.from(new Set(matches.map((m) => m.replace(/\s+/g, ''))));
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

/**
 * Clasificación Jurídica Automática de alta precisión (7 categorías canónicas):
 * - Aceptación de Herencia
 * - Declaratoria de Rebeldía
 * - Título Supletorio
 * - Subasta Pública
 * - Aviso de Sociedad
 * - Decreto/Acuerdo
 * - Edicto Judicial
 */
export function classifyLegalRecord(text: string, category?: CategoryType): LegalClassification {
  const lower = text.toLowerCase();
  if (
    lower.includes('herencia') ||
    lower.includes('heredero') ||
    lower.includes('sucesión') ||
    lower.includes('sucesion') ||
    lower.includes('causante') ||
    lower.includes('intestada')
  ) {
    return 'Aceptación de Herencia';
  }
  if (
    lower.includes('rebeldía') ||
    lower.includes('rebeldia') ||
    lower.includes('ausente') ||
    lower.includes('orden de captura') ||
    lower.includes('órdenes de captura')
  ) {
    return 'Declaratoria de Rebeldía';
  }
  if (
    lower.includes('título supletorio') ||
    lower.includes('titulo supletorio') ||
    lower.includes('titulación supletoria') ||
    lower.includes('titulacion supletoria') ||
    lower.includes('título municipal')
  ) {
    return 'Título Supletorio';
  }
  if (
    category === 'SUBASTA_EMBARGO' ||
    lower.includes('subasta') ||
    lower.includes('remate') ||
    lower.includes('embargo') ||
    lower.includes('pública subasta')
  ) {
    return 'Subasta Pública';
  }
  if (
    category === 'BALANCE_FINANCIERO' ||
    category === 'REGISTRO_MARCA' ||
    lower.includes('sociedad anónima') ||
    lower.includes('s.a. de c.v.') ||
    lower.includes('balance general') ||
    lower.includes('disolución') ||
    lower.includes('liquidación') ||
    lower.includes('marca') ||
    lower.includes('signo distintivo')
  ) {
    return 'Aviso de Sociedad';
  }
  if (
    category === 'DECRETO_LEGISLATIVO' ||
    category === 'ACUERDO_EJECUTIVO' ||
    lower.includes('decreto no') ||
    lower.includes('acuerdo no') ||
    lower.includes('órgano legislativo') ||
    lower.includes('organo legislativo') ||
    lower.includes('ramo de')
  ) {
    return 'Decreto/Acuerdo';
  }
  return 'Edicto Judicial';
}

export function parseRawEntry(
  rawText: string,
  meta: { tomo: number; numero: number; fecha: string; pagina: number; pdfUrl: string }
): DiarioRecord {
  const cleaned = rawText.replace(/\s+/g, ' ').trim();
  const duis = extractDuis(rawText);
  const nits = extractNits(cleaned);
  const categoria = detectCategory(cleaned);
  const clasificacionJuridica = classifyLegalRecord(cleaned, categoria);

  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const titular = lines[0]?.slice(0, 120) || `Publicación Oficial Pag. ${meta.pagina}`;

  return {
    id: `do-${meta.tomo}-${meta.numero}-p${meta.pagina}-${Math.random().toString(36).slice(2, 7)}`,
    tomo: meta.tomo,
    numero: meta.numero,
    fecha: meta.fecha,
    pagina: meta.pagina,
    categoria,
    clasificacionJuridica,
    seccion: categoria === 'EDICTO_JUDICIAL' ? 'Carteles Oficiales y Edictos Judiciales' : categoria === 'REGISTRO_MARCA' ? 'Registro de la Propiedad Intelectual' : 'Sección Oficial General',
    titular,
    contenido: cleaned,
    duisEncontrados: duis,
    nitsEncontrados: nits,
    nombresClave: [],
    pdfUrlOficial: meta.pdfUrl
  };
}
