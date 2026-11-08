// Lectura de DUIs escritos en letras (formas notariales) para el Diario Oficial.
// Cubre dos formas: dígito por dígito ("CERO UNO DOS ... - SIETE") y cardinal
// ("cero cero seiscientos ocho mil cuatrocientos setenta - uno").

export const DIGIT_WORDS: Record<string, string> = {
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

/** Fragmento de regex que reconoce una palabra-dígito. */
export const DIGIT_WORD_RE = '(?:cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)';

const SMALL: Record<string, number> = {
  un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17,
  dieciocho: 18, diecinueve: 19, veinte: 20, veintiun: 21, veintiuno: 21, veintidos: 22, veintitres: 23,
  veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
  cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500,
  seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900
};

const sinAcentos = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Convierte un cardinal en español (hasta millones) a entero; null si algún token no se reconoce. */
export function parseSpanishCardinal(tokens: string[]): number | null {
  let total = 0;
  let current = 0;
  let seen = false;
  for (const raw of tokens) {
    const t = sinAcentos(raw);
    if (t === 'y') continue;
    if (t === 'mil') {
      total += (current || 1) * 1000;
      current = 0;
    } else if (t === 'millon' || t === 'millones') {
      total += (current || 1) * 1_000_000;
      current = 0;
    } else if (SMALL[t] !== undefined) {
      current += SMALL[t]!;
    } else {
      return null;
    }
    seen = true;
  }
  return seen ? total + current : null;
}

/**
 * Busca DUIs en forma cardinal tras "Documento Único de Identidad número ... - dígito".
 * Exige exactamente 8 dígitos antes del guion (ceros iniciales + valor).
 */
export function extractCardinalDuis(text: string): string[] {
  const out: string[] = [];
  const re = /identidad\s*(?:n[uú]mero)?\s*:?\s*((?:[A-Za-zÁÉÍÓÚÑáéíóúñ]+\s+){1,16}?[A-Za-zÁÉÍÓÚÑáéíóúñ]+)\s*[-–—]\s*(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\b/gi;
  for (const m of text.matchAll(re)) {
    const tokens = m[1]!.trim().split(/\s+/);
    let start = 0;
    while (start < tokens.length && !isNumeral(tokens[start]!)) start++;
    const num = tokens.slice(start);
    if (num.length === 0 || !num.some((t) => !(sinAcentos(t) in DIGIT_WORDS))) continue; // las de solo dígitos ya las cubre el extractor principal
    let zeros = 0;
    while (zeros < num.length && sinAcentos(num[zeros]!) === 'cero') zeros++;
    const value = parseSpanishCardinal(num.slice(zeros));
    if (value === null) continue;
    const head = '0'.repeat(zeros) + String(value);
    if (head.length !== 8) continue;
    out.push(`${head}-${DIGIT_WORDS[sinAcentos(m[2]!)]}`);
  }
  return out;
}

function isNumeral(tok: string): boolean {
  const t = sinAcentos(tok);
  return t in DIGIT_WORDS || t in SMALL || t === 'mil' || t === 'millon' || t === 'millones';
}
