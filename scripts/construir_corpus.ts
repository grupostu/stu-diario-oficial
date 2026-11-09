// Reconstruye e ingiere el corpus de Diarios Oficiales A PARTIR DEL PDF (nunca de datos escritos a mano).
//
// Soporta ingesta multi-diario: combina nuevos diarios con los ya existentes respetando su origen.
// Valida que cada dato (tomo, número, fecha, rangos, contenido, DUI, NIT) salga literalmente del PDF.
// Lo que no se pueda comprobar contra el PDF se rechaza y no entra al corpus.
//
// Uso:
//   npx tsx scripts/construir_corpus.ts [rutaPdf1.pdf ...] [--reemplazar]
//   npx tsx scripts/construir_corpus.ts public/pdf/23-10-2026.pdf
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { extraerPaginas, type PaginaExtraida } from './pdf_paginas.js';
import { nucleo } from '../src/resaltado.js';
import { extractDuis, extractNits, classifyLegalRecord } from '../src/parser.js';
import type { CategoryType } from '../src/types.js';
import { construirTitular, nombrePropio } from '../src/titles.js';
import type { DiarioRecord } from '../src/types.js';
import type { Diario } from '../src/diarios.js';
import {
  validarRegistros,
  validarFichaDiario,
  fusionarCorpus,
  fusionarCatalogo,
  verificarCorpus
} from '../src/validacion_ingesta.js';
import { cargarOcr } from '../src/ocr.js';

interface LineaCuerpo {
  pagina: number;
  a: number;
  b: number;
  texto: string;
  x0: number;
  x1: number;
  col: number;
  margen: number;
  k: string;
}

interface Borrador {
  modo?: string;
  designacion?: string;
  ramo?: string;
  lineas: LineaCuerpo[];
  seccion: string;
  publicacion: string;
  encabezado: string | null;
}

const MESES: Record<string, string> = {
  enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
  julio: '07', agosto: '08', septiembre: '09', setiembre: '09', octubre: '10',
  noviembre: '11', diciembre: '12'
};

/** Categoría por el encabezado y el arranque del texto (no por palabras sueltas como «marcadas»). */
function categorizar(contenido: string): CategoryType {
  const ini = nucleo.plegar(contenido.slice(0, 500)).plano;
  if (/\b(marca de fabrica|marca de servicio|marca de comercio|signo distintivo|nombre comercial|solicitud de (registro de )?marca)\b/.test(ini)) return 'REGISTRO_MARCA';
  if (/\b(subasta|remate|embargo)\b/.test(ini)) return 'SUBASTA_EMBARGO';
  if (/\b(balance|liquidacion|fusion|convocatoria|junta general|sociedad anonima|capital variable)\b/.test(ini)) return 'BALANCE_FINANCIERO';
  if (/\b(herencia|heredero|juzgado|juez|jueza|notario|notaria|titulo supletorio|titulo de dominio|titulo municipal|muerte presunta|emplazamiento|edicto|alcalde)\b/.test(ini)) return 'EDICTO_JUDICIAL';
  return 'GENERAL';
}

const sinEspacios = (s: string): string => nucleo.plegar(s).plano.replace(/[^a-z0-9]/g, '');

// Franjas estructurales: delimitan secciones pero no forman parte de ninguna publicación.
const ESTRUCTURAL = [
  /^ORGANO(LEGISLATIVO|EJECUTIVO|JUDICIAL)$/,
  /^INSTITUCIONESAUTONOMAS$/,
  /^ALCALDIASMUNICIPALES$/,
  /^SECCIONCARTELES[A-Z]*$/,
  /^DEPRIMERAPUBLICACION$/,
  /^DESEGUNDAPUBLICACION$/,
  /^DETERCERAPUBLICACION$/,
  /^(MINISTERIO|RAMO)DE[A-Z]+$/,
  /^CORTESUPREMADEJUSTICIA$/
];
const esEstructural = (txt: string): boolean => {
  const u = sinEspacios(txt).toUpperCase();
  if (!ESTRUCTURAL.some((re) => re.test(u))) return false;
  // Un ministerio o ramo solo es franja si ocupa una línea corta sin puntuación de oración.
  return !/^(MINISTERIO|RAMO|CORTE)/.test(u) || (txt.length <= 70 && !/[,;:]/.test(txt));
};

const PIE_EDICTO = /^(Of\.\s*)?\d+\s*v\.\s*(alt\.|c\.)?\s*(No\.|cód\.|cod\.)/i;
const INICIO_DOC = /^(DECRETO|ACUERDO)\s+(No\.?|N[°º]|NÚMERO)?\s*[\wÁÉÍÓÚ-]+/;

function esTitulo(s: string): boolean {
  return /^[A-Za-zÁÉÍÓÚÑáéíóúñ ]{4,70}$/.test(s);
}

function cuerpoDe(pag: PaginaExtraida): LineaCuerpo[] {
  const out: LineaCuerpo[] = [];
  const anchas = pag.lineas.filter((l) => l.k !== 'c' && l.x1 - l.x0 > 150);
  const margen = (col: number): number => {
    const xs = anchas.filter((l) => l.c === col || l.c === 0).map((l) => l.x0).sort((p, q) => p - q);
    return xs.length ? xs[Math.floor(xs.length * 0.1)]! : 58;
  };
  const mg: Record<number, number> = { 0: margen(0), 1: margen(1), 2: margen(2) };
  for (const l of pag.lineas) {
    out.push({ pagina: pag.pagina, a: l.a, b: l.b, texto: pag.texto.slice(l.a, l.b), x0: l.x0, x1: l.x1, col: l.c, margen: mg[l.c] ?? 58, k: l.k });
  }
  return out;
}

/** Une líneas en párrafos: reúne palabras partidas con guion y respeta la sangría de apertura. */
function textoDe(lineas: LineaCuerpo[]): string {
  const parrafos: string[] = [];
  let actual = '';
  let prev: LineaCuerpo | null = null;
  for (const l of lineas) {
    const t = l.texto.replace(/\s+/g, ' ').trim();
    if (!t) continue;
    const sangria = l.x0 - l.margen > 8 && l.k === 'p';
    const nuevoParrafo = !prev || sangria || (prev.col !== l.col && /[.:;]$/.test(actual)) || (l.k === 'b' && !/^[a-záéíóúñ(]/.test(t) && /[.:]$/.test(actual) && l.x0 - l.margen > 20);
    if (nuevoParrafo && actual) {
      parrafos.push(actual);
      actual = '';
    }
    if (!actual) actual = t;
    else if (/\p{L}-$/u.test(actual) && /^\p{L}/u.test(t)) actual = actual.slice(0, -1) + t;
    else actual += ' ' + t;
    prev = l;
  }
  if (actual) parrafos.push(actual);
  return parrafos.join('\n');
}

/** Rangos contiguos por página, para dibujar el resaltado exacto de toda la publicación en el PDF. */
function rangosDe(lineas: LineaCuerpo[]): Array<[number, number, number]> {
  const out: Array<[number, number, number]> = [];
  for (const l of lineas) {
    const u = out[out.length - 1];
    if (u && u[0] === l.pagina && l.a - u[2] <= 1) u[2] = l.b;
    else out.push([l.pagina, l.a, l.b]);
  }
  return out;
}

function limpiarEncabezado(t: string): string {
  return t.replace(/\s+/g, ' ').trim().toUpperCase();
}

export interface ResultadoIngesta {
  diarioId: string;
  tomo: number;
  numero: number;
  fecha: string;
  totalPaginas: number;
  totalExtraidos: number;
  aceptados: number;
  rechazados: number;
  sha256: string;
}

export async function procesarPdfDiario(rutaPdfAbsoluta: string, opts: { reemplazar?: boolean } = {}): Promise<ResultadoIngesta> {
  const paginas = await extraerPaginas(rutaPdfAbsoluta);
  const n = paginas.length;
  console.log(`[ingesta] ${n} páginas leídas de ${rutaPdfAbsoluta}`);

  const bytes = fs.readFileSync(rutaPdfAbsoluta);
  const sha256Pdf = crypto.createHash('sha256').update(bytes).digest('hex');

  // Datos de la edición, leídos de la portada
  const portada = nucleo.plegar(paginas[0]!.texto).plano;
  const tomo = /tomo\s*n\S*\s*(\d{2,4})/.exec(portada)?.[1];
  const numero = /numero\s*(\d{1,4})/.exec(portada)?.[1];
  const f = /(\d{1,2}) de (\w+) de ?\s*(\d{4})/.exec(portada.replace(/\bde(\d{4})/, 'de $1'));
  if (!tomo || !numero || !f || !MESES[f[2]!]) {
    throw new Error(`No se pudo leer tomo, número y fecha de la portada del PDF: ${rutaPdfAbsoluta}`);
  }
  const fecha = `${f[3]}-${MESES[f[2]!]}-${f[1]!.padStart(2, '0')}`;
  const idDiario = fecha;
  console.log(`[ingesta] Tomo ${tomo} · N.° ${numero} · ${fecha} (sha256: ${sha256Pdf.slice(0, 16)}...)`);

  // Encabezados válidos de los edictos (tomados del sumario del propio PDF)
  const encabezados = new Set<string>();
  for (const pg of [paginas[0]!, paginas[1]!]) {
    for (const l of pg.lineas) {
      const t = pg.texto.slice(l.a, l.b).replace(/[.…\s\d-]+$/, '').trim();
      const k = sinEspacios(t);
      if (k.length >= 8 && k.length <= 60 && esTitulo(t)) encabezados.add(k);
    }
  }
  const esEncabezado = (t: string): boolean => encabezados.has(sinEspacios(t.replace(/[.\s]+$/, ''))) || /^(AVISO|CONVOCATORIA|EDICTO|CARTEL)\b/.test(t.trim());

  const registros: DiarioRecord[] = [];
  let seq = 0;
  const idBase = `do-${tomo}-${fecha.replace(/-/g, '')}`;
  let modo: 'sumario' | 'doc' | 'edicto' = 'sumario';
  let seccion = 'Portada y sumario';
  let publicacion = '';
  let ramo = '';
  let borrador: Borrador | null = null;

  const cerrar = (): void => {
    const b = borrador;
    borrador = null;
    if (!b || b.lineas.length === 0) return;
    const ls = b.lineas;
    const cuerpoLs = b.encabezado ? ls.slice(1) : ls;
    let contenido = textoDe(cuerpoLs);
    if (b.encabezado) contenido = contenido ? `${b.encabezado}\n${contenido}` : b.encabezado;
    if (contenido.replace(/\s/g, '').length < 20) return;

    const mRamo = /\bEN EL RAMO DE\s+([A-ZÁÉÍÓÚÑ ,]+?),?\s+(?:en uso|vista|en el uso)\b/.exec(contenido.slice(0, 400).replace(/\s+/g, ' '));
    if (mRamo && b.modo === 'doc') b.ramo = nombrePropio(mRamo[1]!.trim());
    const pagina = ls[0]!.pagina;
    const paginaFin = ls[ls.length - 1]!.pagina;
    const legislativo = /^(DECRETO|ACUERDO)\b/.test(contenido);
    const categoria = b.modo === 'doc'
      ? (/legislativ/i.test(b.seccion) ? 'DECRETO_LEGISLATIVO' : 'ACUERDO_EJECUTIVO')
      : legislativo
      ? (/^DECRETO/.test(contenido) && /legislativ/i.test(b.seccion) ? 'DECRETO_LEGISLATIVO' : 'ACUERDO_EJECUTIVO')
      : categorizar(contenido);

    registros.push({
      id: `${idBase}-p${pagina}-r${++seq}`,
      tomo: Number(tomo),
      numero: Number(numero),
      fecha,
      pagina,
      paginaFin,
      categoria,
      clasificacionJuridica: classifyLegalRecord(contenido, categoria),
      seccion: b.seccion,
      publicacion: b.publicacion || undefined,
      titular: b.designacion ? `${b.designacion}${b.ramo ? ' — ' + b.ramo : ''}` : b.modo === 'doc' ? `${b.ramo || b.seccion} · ${contenido.replace(/\s+/g, ' ').slice(0, 90).trim()}…` : pagina <= 2 ? `Sumario del Diario Oficial · Tomo ${tomo}, N.° ${numero}` : construirTitular(contenido, { esLegislativo: legislativo, titularActual: b.encabezado ?? '' }),
      contenido,
      duisEncontrados: extractDuis(contenido),
      nitsEncontrados: extractNits(contenido),
      nombresClave: [],
      rangos: rangosDe(ls),
      diarioId: idDiario,
      pdfUrlOficial: `/pdf/${path.basename(rutaPdfAbsoluta)}#page=${pagina}`
    } as DiarioRecord);
  };

  for (const pag of paginas) {
    const lineas = cuerpoDe(pag);
    for (const l of lineas) {
      if (l.k === 'c') {
        if (/^\(Registro No/i.test(l.texto.trim()) && borrador) (borrador as Borrador).lineas.push(l);
        continue;
      }
      const txt = l.texto.trim();
      if (!txt || /^Imprenta Nacional\s*-\s*Tiraje/i.test(txt)) continue;
      if (pag.pagina <= 2) {
        if (!borrador) borrador = { lineas: [], seccion, publicacion: '', encabezado: null };
        (borrador as Borrador).lineas.push(l);
        continue;
      }
      if (esEstructural(txt)) {
        const u = sinEspacios(txt).toUpperCase();
        if (/^SECCIONCARTELES/.test(u)) {
          cerrar();
          modo = 'edicto';
          seccion = /PAGADOS/.test(u) ? 'Sección Carteles Pagados' : 'Sección Carteles Oficiales';
          publicacion = '';
        } else if (/^DE(PRIMERA|SEGUNDA|TERCERA)PUBLICACION$/.test(u)) {
          cerrar();
          publicacion = /PRIMERA/.test(u) ? 'Primera publicación' : /SEGUNDA/.test(u) ? 'Segunda publicación' : 'Tercera publicación';
        } else if (/^ORGANO|^INSTITUCIONES|^ALCALDIAS/.test(u)) {
          cerrar();
          modo = 'doc';
          ramo = '';
          seccion = /LEGISLATIVO/.test(u) ? 'Órgano Legislativo' : /EJECUTIVO/.test(u) ? 'Órgano Ejecutivo' : /JUDICIAL/.test(u) ? 'Órgano Judicial' : /AUTONOMAS/.test(u) ? 'Instituciones Autónomas' : 'Alcaldías Municipales';
        } else {
          cerrar();
          ramo = nombrePropio(txt.replace(/\s+/g, ' ').replace(/[.\s]+$/, '').trim());
        }
        continue;
      }
      if (modo === 'doc') {
        if (INICIO_DOC.test(txt)) {
          cerrar();
          const m = /^(DECRETO|ACUERDO)\s+(?:No\.?|N[°º]|NÚMERO)?\s*([\wÁÉÍÓÚ/-]+)/.exec(txt);
          const numDoc = m ? m[2]!.replace(/[.-]+$/, '') : '';
          borrador = { modo: 'doc', lineas: [], seccion, publicacion: '', encabezado: null, ramo, designacion: m ? `${m[1]![0]}${m[1]!.slice(1).toLowerCase()} No. ${numDoc}` : undefined };
        }
        if (!borrador) borrador = { modo: 'doc', lineas: [], seccion, publicacion: '', encabezado: null, ramo };
        (borrador as Borrador).lineas.push(l);
      } else if (modo === 'edicto') {
        if (!borrador) {
          borrador = { lineas: [], seccion, publicacion, encabezado: null };
          if (esEncabezado(txt)) (borrador as Borrador).encabezado = limpiarEncabezado(txt);
        }
        (borrador as Borrador).lineas.push(l);
        if (PIE_EDICTO.test(txt) && txt.length < 60) cerrar();
      }
    }
  }
  cerrar();

  // Validación estricta contra el texto del PDF
  const paginasTexto = paginas.map((p) => p.texto);
  const ocrExistente = cargarOcr(idDiario);
  const paginasConOcr = ocrExistente ? Object.keys(ocrExistente.paginas).map(Number).sort((a, b) => a - b) : undefined;

  const nuevaFicha: Diario = {
    id: idDiario,
    tomo: Number(tomo),
    numero: Number(numero),
    fecha,
    paginas: n,
    pdf: `/pdf/${path.basename(rutaPdfAbsoluta)}`,
    sha256: sha256Pdf,
    ...(paginasConOcr && paginasConOcr.length > 0 ? { paginasConOcr } : {})
  };

  const errFicha = validarFichaDiario(nuevaFicha, { paginas: n, sha256: sha256Pdf });
  if (errFicha.length > 0) {
    throw new Error(`Ficha de catálogo inválida: ${errFicha.join('; ')}`);
  }

  const { aceptados, rechazados } = validarRegistros(registros, paginasTexto, nuevaFicha);
  if (rechazados.length > 0) {
    console.warn(`[ingesta] ${rechazados.length} registro(s) rechazados por discrepancia con el PDF original:`);
    for (const r of rechazados.slice(0, 5)) {
      console.warn(`         [${r.id}] ${r.problemas.join('; ')}`);
    }
  }

  // Fusión con corpus y catálogo existentes (multi-diario)
  const raiz = process.cwd();
  const rutaCorpus = path.join(raiz, 'src', 'data_diario_real.json');
  const rutaCatalogo = path.join(raiz, 'src', 'diarios.json');

  let corpusExistente: DiarioRecord[] = [];
  if (fs.existsSync(rutaCorpus)) {
    try {
      corpusExistente = JSON.parse(fs.readFileSync(rutaCorpus, 'utf8'));
    } catch {
      corpusExistente = [];
    }
  }

  let catalogoExistente: Diario[] = [];
  if (fs.existsSync(rutaCatalogo)) {
    try {
      catalogoExistente = JSON.parse(fs.readFileSync(rutaCatalogo, 'utf8'));
    } catch {
      catalogoExistente = [];
    }
  }

  const corpusFinal = fusionarCorpus(corpusExistente, aceptados, idDiario);
  const catalogoFinal = fusionarCatalogo(catalogoExistente, nuevaFicha, { reemplazar: opts.reemplazar });

  fs.mkdirSync(path.join(raiz, 'public', 'data'), { recursive: true });
  fs.writeFileSync(
    path.join(raiz, 'public', 'data', `paginas-${idDiario}.json`),
    JSON.stringify({ id: idDiario, ancho: paginas[0]!.ancho, alto: paginas[0]!.alto, paginas: paginasTexto }),
    'utf8'
  );
  fs.writeFileSync(rutaCorpus, JSON.stringify(corpusFinal, null, 1) + '\n', 'utf8');
  fs.writeFileSync(rutaCatalogo, JSON.stringify(catalogoFinal, null, 1) + '\n', 'utf8');

  console.log(`[ingesta] Diario ${idDiario}: ${aceptados.length} aceptados, ${rechazados.length} rechazados. Corpus total: ${corpusFinal.length} publicaciones.`);

  return {
    diarioId: idDiario,
    tomo: Number(tomo),
    numero: Number(numero),
    fecha,
    totalPaginas: n,
    totalExtraidos: registros.length,
    aceptados: aceptados.length,
    rechazados: rechazados.length,
    sha256: sha256Pdf
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const reemplazar = args.includes('--reemplazar');
  const rutasPdfs = args.filter((a) => !a.startsWith('--'));

  const candidatos = rutasPdfs.length > 0
    ? rutasPdfs
    : ['public/pdf/23-10-2026.pdf'];

  const resultados: ResultadoIngesta[] = [];
  for (const r of candidatos) {
    const rutaAbs = path.resolve(r);
    if (!fs.existsSync(rutaAbs)) {
      console.error(`[ingesta] Archivo PDF no encontrado: ${rutaAbs}`);
      process.exit(1);
    }
    const res = await procesarPdfDiario(rutaAbs, { reemplazar });
    resultados.push(res);
  }

  // Verificación integral final del corpus y catálogo
  const raiz = process.cwd();
  const corpusActual = JSON.parse(fs.readFileSync(path.join(raiz, 'src', 'data_diario_real.json'), 'utf8'));
  const catalogoActual = JSON.parse(fs.readFileSync(path.join(raiz, 'src', 'diarios.json'), 'utf8'));
  const { problemas, sinDiario } = verificarCorpus(corpusActual, catalogoActual, (id) => {
    const p = path.join(raiz, 'public', 'data', `paginas-${id}.json`);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8')).paginas;
  });

  if (problemas.length > 0 || sinDiario.length > 0) {
    console.error(`[ingesta] ERROR: Verificación integral falló. Problemas: ${problemas.length}, Sin diario: ${sinDiario.length}`);
    process.exit(1);
  }

  console.log(`[ingesta] Multi-diario verificado: ${catalogoActual.length} diario(s) en catálogo, ${corpusActual.length} publicaciones en total.`);
}

main().catch((e) => {
  console.error('[ingesta] Error:', e);
  process.exit(1);
});
