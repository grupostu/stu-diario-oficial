// Esquema estricto de los parámetros del endpoint de búsqueda (Zero-Trust: nada del cliente se acepta sin validar).
import type { CategoryType } from './types.js';

export const CATEGORIAS_VALIDAS: readonly CategoryType[] = [
  'EDICTO_JUDICIAL',
  'REGISTRO_MARCA',
  'DECRETO_LEGISLATIVO',
  'ACUERDO_EJECUTIVO',
  'SUBASTA_EMBARGO',
  'BALANCE_FINANCIERO',
  'GENERAL'
];

export const LIMITES_API = {
  /** Longitud máxima de la consulta (caracteres). */
  maxConsulta: 200,
  porPaginaDefecto: 10,
  maxPorPagina: 50,
  maxPagina: 1000
} as const;

export interface ParametrosValidados {
  q: string;
  categoria?: CategoryType;
  soloDui: boolean;
  pagina: number;
  porPagina: number;
}

export type ValidacionBusqueda =
  | { ok: true; valor: ParametrosValidados }
  | { ok: false; errores: Array<{ campo: string; mensaje: string }> };

function unico(v: unknown): { valor: string | undefined; error?: string } {
  if (v === undefined) return { valor: undefined };
  if (typeof v !== 'string') return { valor: undefined, error: 'Debe enviarse una sola vez y como texto.' };
  return { valor: v };
}

function entero(campo: string, v: unknown, min: number, max: number, defecto: number, errores: Array<{ campo: string; mensaje: string }>): number {
  const u = unico(v);
  if (u.error) {
    errores.push({ campo, mensaje: u.error });
    return defecto;
  }
  if (u.valor === undefined || u.valor === '') return defecto;
  if (!/^[0-9]{1,6}$/.test(u.valor)) {
    errores.push({ campo, mensaje: `Debe ser un número entero entre ${min} y ${max}.` });
    return defecto;
  }
  const n = Number(u.valor);
  if (n < min || n > max) {
    errores.push({ campo, mensaje: `Debe estar entre ${min} y ${max}.` });
    return defecto;
  }
  return n;
}

/** Valida el objeto `req.query` de Express. Rechaza arreglos, objetos anidados, números fuera de rango y categorías desconocidas. */
export function validarParametrosBusqueda(query: Record<string, unknown>): ValidacionBusqueda {
  const errores: Array<{ campo: string; mensaje: string }> = [];

  const q = unico(query.q);
  if (q.error) errores.push({ campo: 'q', mensaje: q.error });
  const texto = q.valor ?? '';
  if (texto.length > LIMITES_API.maxConsulta * 10) {
    errores.push({ campo: 'q', mensaje: `La consulta admite ${LIMITES_API.maxConsulta} caracteres como máximo.` });
  } else if (texto.replace(/\s+/g, ' ').trim().length > LIMITES_API.maxConsulta) {
    errores.push({ campo: 'q', mensaje: `La consulta admite ${LIMITES_API.maxConsulta} caracteres como máximo. Acórtala y vuelve a intentar.` });
  }

  let categoria: CategoryType | undefined;
  const cat = unico(query.categoria);
  if (cat.error) errores.push({ campo: 'categoria', mensaje: cat.error });
  else if (cat.valor) {
    if ((CATEGORIAS_VALIDAS as readonly string[]).includes(cat.valor)) categoria = cat.valor as CategoryType;
    else errores.push({ campo: 'categoria', mensaje: 'La sección elegida no existe.' });
  }

  let soloDui = false;
  const f = unico(query.forceDui);
  if (f.error) errores.push({ campo: 'forceDui', mensaje: f.error });
  else if (f.valor !== undefined && f.valor !== '') {
    if (f.valor === 'true' || f.valor === '1') soloDui = true;
    else if (f.valor !== 'false' && f.valor !== '0') errores.push({ campo: 'forceDui', mensaje: 'Debe ser true, false, 1 o 0.' });
  }

  const pagina = entero('pagina', query.pagina, 1, LIMITES_API.maxPagina, 1, errores);
  const porPagina = entero('porPagina', query.porPagina, 1, LIMITES_API.maxPorPagina, LIMITES_API.porPaginaDefecto, errores);

  if (errores.length > 0) return { ok: false, errores };
  return { ok: true, valor: { q: texto, categoria, soloDui, pagina, porPagina } };
}
