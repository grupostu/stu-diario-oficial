// Validación de la ingesta de diarios: cada dato del corpus debe poder rastrearse a un diario y a una página
// del PDF. Lo que no se pueda comprobar contra el texto del PDF se RECHAZA (no se corrige ni se completa).
// Funciones puras: reciben el texto de las páginas ya extraído del PDF y devuelven la lista de problemas.
import type { DiarioRecord } from './types.js';
import { extractDuis, extractNits } from './parser.js';
import { esDiarioValido, type Diario } from './diarios.js';

/** Pliega para comparar: sin tildes, minúsculas y solo letras/dígitos (ignora saltos de línea, espacios y guiones de corte). */
export const plegarComparacion = (s: string): string => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

const RUTA_PDF_PUBLICA = /^\/pdf\/[\w.-]+\.pdf$/;

/** Problemas de un registro frente al texto de las páginas de su PDF (vacío = el registro sale del PDF). */
export function validarRegistroContraPdf(r: DiarioRecord, paginas: string[], diario: Pick<Diario, 'id' | 'tomo' | 'numero' | 'fecha' | 'pdf'>): string[] {
  const p: string[] = [];
  if ((r.diarioId ?? r.fecha) !== diario.id) p.push('diarioId no coincide con el diario que se ingiere');
  if (r.tomo !== diario.tomo || r.numero !== diario.numero || r.fecha !== diario.fecha) p.push('tomo, número o fecha no coinciden con la portada del PDF');
  if (!Array.isArray(r.rangos) || r.rangos.length === 0) {
    p.push('sin rangos de origen en el PDF');
    return p;
  }
  const trozos: string[] = [];
  for (const [n, desde, hasta] of r.rangos) {
    if (!Number.isInteger(n) || n < 1 || n > paginas.length) {
      p.push(`página ${n} fuera del diario`);
      continue;
    }
    const txt = paginas[n - 1]!;
    if (!Number.isInteger(desde) || !Number.isInteger(hasta) || desde < 0 || hasta <= desde || hasta > txt.length) {
      p.push(`rango [${desde}, ${hasta}) fuera del texto de la página ${n}`);
      continue;
    }
    const t = txt.slice(desde, hasta);
    if (!t.trim()) p.push(`la página ${n} no tiene texto en el PDF`);
    trozos.push(t);
  }
  if (p.length === 0 && plegarComparacion(r.contenido) !== plegarComparacion(trozos.join(' '))) p.push('el contenido no coincide con el texto de esas páginas del PDF');
  if (r.pagina !== r.rangos[0]![0]) p.push('la página del registro no es la primera de sus rangos');
  if ((r.paginaFin ?? r.pagina) !== r.rangos[r.rangos.length - 1]![0]) p.push('paginaFin no es la última página de sus rangos');
  if (r.pdfUrlOficial !== `${diario.pdf}#page=${r.pagina}`) p.push('pdfUrlOficial no apunta a la página del PDF del diario');
  // Entidades derivadas: solo valen si salen literalmente del texto del registro.
  if (JSON.stringify([...r.duisEncontrados].sort()) !== JSON.stringify(extractDuis(r.contenido).sort())) p.push('duisEncontrados no coincide con los DUI del propio texto');
  if (JSON.stringify([...r.nitsEncontrados].sort()) !== JSON.stringify(extractNits(r.contenido).sort())) p.push('nitsEncontrados no coincide con los NIT del propio texto');
  const paginasDelRegistro = plegarComparacion(r.rangos.map(([n]) => paginas[n - 1] ?? '').join(' '));
  for (const nombre of r.nombresClave ?? []) {
    if (!paginasDelRegistro.includes(plegarComparacion(nombre))) p.push(`la entidad «${nombre}» no aparece en las páginas del registro`);
  }
  if (r.categoria === 'REGISTRO_MARCA' && !/marca|signo|nombrecomercial/.test(plegarComparacion(r.contenido))) p.push('categoría de marca sin texto de marca en el PDF');
  return p;
}

export interface Rechazo {
  id: string;
  problemas: string[];
}

/** Separa los registros que salen del PDF de los que no. También rechaza ids repetidos. */
export function validarRegistros(registros: DiarioRecord[], paginas: string[], diario: Diario): { aceptados: DiarioRecord[]; rechazados: Rechazo[] } {
  const aceptados: DiarioRecord[] = [];
  const rechazados: Rechazo[] = [];
  const vistos = new Set<string>();
  for (const r of registros) {
    const problemas = validarRegistroContraPdf(r, paginas, diario);
    if (vistos.has(r.id)) problemas.push('id duplicado');
    vistos.add(r.id);
    if (problemas.length) rechazados.push({ id: r.id, problemas });
    else aceptados.push(r);
  }
  return { aceptados, rechazados };
}

/** Problemas de la ficha de catálogo de un diario frente a lo medido en su PDF. */
export function validarFichaDiario(d: unknown, medido: { paginas: number; sha256: string }): string[] {
  const p: string[] = [];
  if (!esDiarioValido(d)) return ['la ficha del diario es inválida (tomo, número, fecha, páginas o ruta del PDF)'];
  if (d.paginas !== medido.paginas) p.push(`el catálogo dice ${d.paginas} páginas y el PDF tiene ${medido.paginas}`);
  if (d.sha256 !== undefined && d.sha256 !== medido.sha256) p.push('la huella sha256 del catálogo no coincide con el PDF');
  if (!RUTA_PDF_PUBLICA.test(d.pdf)) p.push('ruta de PDF no admitida');
  return p;
}

/**
 * Combina los registros de un diario recién construido con los ya existentes.
 * Reemplaza solo los del mismo diario; los demás diarios no se tocan. Ordena por fecha (estable).
 */
export function fusionarCorpus(existentes: DiarioRecord[], nuevos: DiarioRecord[], diarioId: string): DiarioRecord[] {
  const resto = existentes.filter((r) => (r.diarioId ?? r.fecha) !== diarioId);
  const ids = new Set(resto.map((r) => r.id));
  for (const r of nuevos) if (ids.has(r.id)) throw new Error(`El id ${r.id} ya existe en otro diario`);
  return [...resto, ...nuevos].sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
}

/** Combina fichas del catálogo: una por id de diario; mismo id con otro PDF es un conflicto. */
export function fusionarCatalogo(existentes: Diario[], nueva: Diario, opts: { reemplazar?: boolean } = {}): Diario[] {
  const previa = existentes.find((d) => d.id === nueva.id);
  if (previa && previa.sha256 && nueva.sha256 && previa.sha256 !== nueva.sha256 && !opts.reemplazar) {
    throw new Error(`Ya existe el diario ${nueva.id} con otro PDF (sha256 distinto). Use --reemplazar solo si es la misma edición corregida.`);
  }
  const otroPdf = existentes.find((d) => d.id !== nueva.id && d.pdf === nueva.pdf);
  if (otroPdf) throw new Error(`El PDF ${nueva.pdf} ya pertenece al diario ${otroPdf.id}`);
  const resto = existentes.filter((d) => d.id !== nueva.id);
  // Conserva los datos de OCR ya registrados solo si el PDF es el mismo.
  const conservar = previa && previa.sha256 === nueva.sha256 && previa.paginasConOcr ? { paginasConOcr: previa.paginasConOcr } : {};
  return [...resto, { ...nueva, ...conservar }].sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
}

/** Verificación integral: todos los registros del corpus frente al texto de página de su diario. */
export function verificarCorpus(corpus: DiarioRecord[], catalogo: Diario[], paginasDe: (id: string) => string[] | null): { problemas: Rechazo[]; sinDiario: string[] } {
  const problemas: Rechazo[] = [];
  const sinDiario: string[] = [];
  const porDiario = new Map<string, DiarioRecord[]>();
  for (const r of corpus) {
    const id = r.diarioId ?? r.fecha;
    porDiario.set(id, [...(porDiario.get(id) ?? []), r]);
  }
  for (const [id, regs] of porDiario) {
    const d = catalogo.find((x) => x.id === id);
    const pags = paginasDe(id);
    if (!d || !pags) {
      sinDiario.push(id);
      continue;
    }
    problemas.push(...validarRegistros(regs, pags, d).rechazados);
  }
  return { problemas, sinDiario };
}
