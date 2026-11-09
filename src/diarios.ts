// Catálogo de diarios cargados. Se genera con scripts/construir_corpus.ts a partir del PDF de cada diario;
// aquí solo se lee y se valida. Jamás se escriben a mano tomos, números, fechas ni páginas.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface Diario {
  /** Identificador estable: la fecha ISO de la edición (YYYY-MM-DD). */
  id: string;
  tomo: number;
  numero: number;
  fecha: string;
  paginas: number;
  /** Ruta local del PDF original (/pdf/archivo.pdf). */
  pdf: string;
}

export const ID_DIARIO = /^\d{4}-\d{2}-\d{2}$/;
const RUTA_PDF = /^\/pdf\/[\w.-]+\.pdf$/;

export function esDiarioValido(d: unknown): d is Diario {
  if (!d || typeof d !== 'object') return false;
  const x = d as Record<string, unknown>;
  return (
    typeof x.id === 'string' && ID_DIARIO.test(x.id) &&
    x.fecha === x.id &&
    Number.isInteger(x.tomo) && (x.tomo as number) > 0 &&
    Number.isInteger(x.numero) && (x.numero as number) > 0 &&
    Number.isInteger(x.paginas) && (x.paginas as number) > 0 && (x.paginas as number) < 5000 &&
    typeof x.pdf === 'string' && RUTA_PDF.test(x.pdf)
  );
}

export function cargarCatalogo(ruta?: string): Diario[] {
  const aqui = path.dirname(fileURLToPath(import.meta.url));
  const candidatos = ruta
    ? [ruta]
    : [path.join(aqui, 'diarios.json'), path.join(aqui, '../src/diarios.json'), path.join(process.cwd(), 'src/diarios.json'), path.join(process.cwd(), 'dist/diarios.json')];
  const archivo = candidatos.find((p) => fs.existsSync(p));
  if (!archivo) return [];
  try {
    const crudo = JSON.parse(fs.readFileSync(archivo, 'utf8')) as unknown;
    if (!Array.isArray(crudo)) return [];
    return crudo.filter(esDiarioValido).sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
  } catch (err) {
    console.error('[stu-diario-oficial] Error al leer diarios.json:', err);
    return [];
  }
}
