// Higiene lingüística del texto OCR del Diario Oficial: palabras guionadas, mayúsculas
// corruptas, marcas de agua y encabezados de página.
import { DIGIT_WORDS } from './dui_words.js';

const LETRA = 'A-Za-zÁÉÍÓÚÑÜáéíóúñü';

const esPalabraDigito = (w: string): boolean => w.toLowerCase() in DIGIT_WORDS;

/**
 * Reconstruye palabras partidas por guion al final de línea ("DEPARTA-\nMENTO" -> "DEPARTAMENTO").
 * Si ambos lados son palabras-dígito ("cinco-\nsiete") es parte de un DUI/matrícula: se conserva el guion.
 */
export function dehyphenate(text: string): string {
  const re = new RegExp(`([${LETRA}]+)-[ \\t]*\\n[ \\t]*([${LETRA}]+)`, 'g');
  return text.replace(re, (_m, a: string, b: string) =>
    esPalabraDigito(a) && esPalabraDigito(b) ? `${a}-${b}` : `${a}${b}`
  );
}

/** Corrige rótulos con mayúsculas/minúsculas alternadas por OCR ("acEPTacioN" -> "ACEPTACION"). */
export function fixOcrCase(text: string): string {
  const re = new RegExp(`[${LETRA}]{4,}`, 'g');
  return text.replace(re, (tok) => {
    if (!/[a-zñáéíóúü][A-ZÑÁÉÍÓÚÜ]/.test(tok)) return tok;
    if (/^(Mc|Mac)[A-Z][a-z]+$/.test(tok)) return tok;
    return tok.toUpperCase();
  });
}

/** Elimina marcas de agua, cabeceras de página del tomo y líneas de sumario con puntos guía. */
export function stripGazetteNoise(text: string): string {
  return text
    .split('\n')
    .filter((line) => {
      const l = line.trim();
      if (/documento\s+solo\s+para\s+consulta/i.test(l)) return false;
      if (/^\d{0,4}\s*DIARIO\s+OFICIAL\b.*\b(?:TOMO|San\s+Salvador|\d{4})\b.*\d*\s*$/.test(l) && l.length < 90) return false;
      if (/\.{5,}\s*\d*\s*$/.test(l)) return false;
      return true;
    })
    .join('\n');
}

/** Pipeline completo de normalización de una publicación. */
export function normalizeText(text: string): string {
  const limpio = fixOcrCase(dehyphenate(stripGazetteNoise(text)))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
  return limpio.trim();
}
