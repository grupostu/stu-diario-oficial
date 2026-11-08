// Curación del corpus: fusiona continuaciones de edictos partidos, higieniza el texto,
// recalcula DUIs/NITs desde el texto final y regenera titulares.
import type { DiarioRecord } from './types.js';
import { extractDuis, extractNits } from './parser.js';
import { normalizeText } from './text_clean.js';
import { construirTitular } from './titles.js';

const MARCADOR = /^\s*\d+\s+(?:v\.?\s*)?(?:alt\.?\s*)?No\.\s*\S+\s*\n/i;

/** Texto sin la línea "1 v. No. F53866" (número de inserción, no parte del acto). */
const cuerpo = (c: string): string => c.replace(MARCADOR, '');

const FIRMA_FINAL = /(SECRETARI[OA]|NOTARI[OA]|ALCALDE|ALCALDESA|PRESIDENTE|REPRESENTANTE LEGAL)\W*(Of\.?\W*)?$/i;

/**
 * ¿El registro es la cola de un edicto que continúa en la página/columna siguiente?
 * Empieza en minúscula o con la fórmula de cierre "Librado en ..." y el anterior no está firmado.
 */
export function esContinuacion(actual: DiarioRecord, previo?: DiarioRecord): boolean {
  if (!previo || actual.categoria === 'DECRETO_LEGISLATIVO' || previo.categoria === 'DECRETO_LEGISLATIVO') return false;
  if (actual.pagina < previo.pagina || actual.pagina - previo.pagina > 1) return false;
  const c = cuerpo(actual.contenido).trimStart();
  const empiezaCola = /^[a-záéíóúñ]/.test(c) || /^(Librado|Dado en)\b/.test(c);
  if (!empiezaCola) return false;
  return !FIRMA_FINAL.test(previo.contenido.trim()) && !/\b(Librado|Dado en)\b/.test(previo.contenido);
}

export function fusionarContinuaciones(records: DiarioRecord[]): DiarioRecord[] {
  const out: DiarioRecord[] = [];
  for (const rec of records) {
    const previo = out[out.length - 1];
    if (previo && esContinuacion(rec, previo)) {
      previo.contenido = `${previo.contenido.trimEnd()}\n${cuerpo(rec.contenido).trimStart()}`;
    } else {
      out.push({ ...rec });
    }
  }
  return out;
}

/** Curación completa e idempotente del corpus. */
export function curarCorpus(records: DiarioRecord[]): DiarioRecord[] {
  const base = records.map((r) => ({ ...r, contenido: normalizeText(r.contenido) }));
  return fusionarContinuaciones(base).map((r) => {
    const contenido = normalizeText(r.contenido);
    const legislativo = r.categoria === 'DECRETO_LEGISLATIVO';
    return {
      ...r,
      categoria: (r.categoria as string) === 'BALANCE_MERCANTIL' ? 'BALANCE_FINANCIERO' : r.categoria,
      contenido,
      titular: construirTitular(contenido, { esLegislativo: legislativo, titularActual: r.titular }),
      duisEncontrados: extractDuis(contenido),
      nitsEncontrados: extractNits(contenido)
    };
  });
}
