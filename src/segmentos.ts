// Modelo documental de la búsqueda: cada publicación se descompone en CAMPOS y PÁRRAFOS direccionables
// (tipo, número, título, órgano emisor, fecha, denominación oficial, sumario, considerandos, artículos,
// párrafos del cuerpo y entidades). La búsqueda opera sobre estos segmentos, no sobre un resumen
// concatenado, así cada coincidencia indica el campo y el párrafo exactos donde ocurre.
import type { DiarioRecord } from './types.js';

export type CampoBusqueda =
  | 'tipo'
  | 'numero'
  | 'titulo'
  | 'organo'
  | 'fecha'
  | 'denominacion'
  | 'sumario'
  | 'considerando'
  | 'articulo'
  | 'dispositivo'
  | 'parrafo'
  | 'entidades'
  | 'seccion';

/** Peso de cada campo en el ranking: número y título pesan mucho más que el cuerpo. */
export const PESO_CAMPO: Record<CampoBusqueda, number> = {
  numero: 100,
  titulo: 60,
  denominacion: 50,
  tipo: 40,
  organo: 30,
  articulo: 25,
  entidades: 15,
  sumario: 20,
  considerando: 15,
  dispositivo: 15,
  parrafo: 10,
  fecha: 6,
  seccion: 5
};

export interface SegmentoDoc {
  campo: CampoBusqueda;
  /** Etiqueta visible para el ciudadano: "Artículo 3", "Considerando II", "Denominación oficial"... */
  etiqueta: string;
  texto: string;
  /** Número de párrafo dentro del cuerpo (1..n) cuando aplica. */
  indice: number | null;
  /** true si pertenece a la identificación del documento (se muestra en la cabecera del resultado). */
  cabecera: boolean;
}

export interface Identificacion {
  /** Tipo del documento: "Decreto Legislativo", "Aceptación de Herencia", "Edicto Judicial"... */
  tipo: string;
  /** Número oficial del decreto/acuerdo (solo dígitos y separador) o null si no aplica. */
  numeroDocumento: string | null;
  /** Texto de la designación completa: "Decreto Legislativo No. 690". */
  designacion: string | null;
  titulo: string;
  organo: string | null;
  fechaIso: string;
  fechaLarga: string;
  /** Ubicación en el diario: "Tomo 453 · N.° 198 · Pág. 1". */
  diario: string;
}

export interface DocumentoSegmentado {
  identificacion: Identificacion;
  segmentos: SegmentoDoc[];
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function fechaLarga(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const mes = MESES[Number(m[2]) - 1];
  return mes ? `${Number(m[3])} de ${mes} de ${m[1]}` : iso;
}

const ETIQUETA_CATEGORIA: Record<string, string> = {
  EDICTO_JUDICIAL: 'Edicto Judicial',
  REGISTRO_MARCA: 'Registro de Marca',
  DECRETO_LEGISLATIVO: 'Decreto Legislativo',
  ACUERDO_EJECUTIVO: 'Acuerdo Ejecutivo',
  SUBASTA_EMBARGO: 'Subasta o Embargo',
  BALANCE_FINANCIERO: 'Balance Financiero',
  GENERAL: 'Publicación Oficial'
};

// Todas las expresiones se aplican solo sobre un prefijo corto (<= 300 caracteres) y están ancladas.
const RE_DESIGNACION =
  /^\s*(Decreto|Acuerdo|Ley|Reglamento)\s{0,3}(Legislativo|Ejecutivo)?\s{0,3}(?:No\.?|N[°º]\.?|Núm\.?|Número)?\s{0,3}(\d{1,5}(?:[-/]\d{2,4})?)\s{0,3}(?:[.\-–—:·]+|$)\s{0,3}/i;
const RE_ORGANO_PREFIJO = /^\s*[ÓO]RGANO\s+(LEGISLATIVO|EJECUTIVO|JUDICIAL)\s*[.:\-–—]?\s*/i;
const RE_ARTICULO = /^\s*Art(?:[íi]culo|\.)?\s{0,2}(\d{1,4}(?:[-\s]?[A-Za-z])?|[ÚU]nico)\s{0,2}[°º]?\s*[.\-–—:)]?\s*/i;
const RE_CONSIDERANDO_TITULO = /^\s*CONSIDERANDOS?\s*[:.\-–—]?\s*$/i;
const RE_ROMANO = /^\s*([IVXLC]{1,6})\s*[.\-–—)]\s*/;
const RE_POR_TANTO = /^\s*POR\s+TANTO\b/i;
const RE_DECRETA = /^\s*(?:DECRETA|DECRETAN|ACUERDA)\b\s*[:.]?/i;
const RE_SUMARIO = /^\s*(?:SUMARIO|RESUMEN|EXTRACTO)\s*[:.\-–—]\s*/i;

const ABREVIATURAS = new Set([
  'no', 'nro', 'num', 'art', 'arts', 'sr', 'sra', 'srta', 'dr', 'dra', 'lic', 'licda', 'ing', 'inc', 'cia',
  'pag', 'tel', 'ref', 'etc', 'vs', 'gral', 'col', 'pje', 'av', 'apdo', 'dpto', 'depto', 'cap', 'fol', 'tomo'
]);

const compactar = (s: string): string => s.replace(/\s+/g, ' ').trim();

/** Divide un texto en oraciones respetando abreviaturas (No., Art., S.A., iniciales) para no cortar mal. */
export function dividirOraciones(texto: string): string[] {
  const out: string[] = [];
  let inicio = 0;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i]!;
    if (ch !== '.' && ch !== '!' && ch !== '?') continue;
    let j = i + 1;
    while (j < texto.length && /["'»”)\]]/.test(texto[j]!)) j++;
    if (j >= texto.length) break;
    if (!/\s/.test(texto[j]!)) continue;
    let k = j;
    while (k < texto.length && /\s/.test(texto[k]!)) k++;
    if (k >= texto.length || !/[A-ZÁÉÍÓÚÑ¿¡"«“]/.test(texto[k]!)) continue;
    if (ch === '.') {
      const previa = /([A-Za-zÁÉÍÓÚÑáéíóúñ]+)$/.exec(texto.slice(Math.max(0, i - 12), i));
      const palabra = previa ? previa[1]!.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() : '';
      if (palabra.length === 1 || ABREVIATURAS.has(palabra)) continue;
    }
    out.push(texto.slice(inicio, j).trim());
    inicio = k;
    i = k - 1;
  }
  const resto = texto.slice(inicio).trim();
  if (resto) out.push(resto);
  return out;
}

const MAX_PARRAFO = 900;
const OBJETIVO_PARTE = 600;

/** Parte un párrafo demasiado largo en trozos de oraciones completas (nunca a mitad de palabra). */
export function trocear(parrafo: string): string[] {
  if (parrafo.length <= MAX_PARRAFO) return [parrafo];
  const partes: string[] = [];
  let actual = '';
  const empujar = (): void => {
    if (actual) partes.push(actual);
    actual = '';
  };
  for (const oracion of dividirOraciones(parrafo)) {
    let o = oracion;
    while (o.length > MAX_PARRAFO) {
      let corte = o.lastIndexOf(' ', MAX_PARRAFO);
      if (corte < MAX_PARRAFO / 2) corte = MAX_PARRAFO;
      empujar();
      partes.push(o.slice(0, corte).trim());
      o = o.slice(corte).trim();
    }
    if (actual && actual.length + 1 + o.length > OBJETIVO_PARTE) empujar();
    actual = actual ? `${actual} ${o}` : o;
  }
  empujar();
  return partes;
}

function esDesignacionTitular(titular: string): { resto: string } | null {
  const m = RE_DESIGNACION.exec(titular.slice(0, 300));
  return m ? { resto: titular.slice(m[0].length) } : null;
}

/** Extrae "— Juzgado ..." de titulares de edictos como autoridad emisora. */
function organoDeTitular(titular: string): string | null {
  const pos = titular.lastIndexOf(' — ');
  if (pos < 0) return null;
  const org = compactar(titular.slice(pos + 3));
  return org.length >= 4 && org.length <= 160 ? org : null;
}

const ORGANOS: Record<string, string> = { LEGISLATIVO: 'Órgano Legislativo', EJECUTIVO: 'Órgano Ejecutivo', JUDICIAL: 'Órgano Judicial' };

export function segmentarRegistro(rec: DiarioRecord): DocumentoSegmentado {
  const segmentos: SegmentoDoc[] = [];
  const titular = compactar(rec.titular ?? '');
  let cuerpo = String(rec.contenido ?? '').replace(/\r\n?/g, '\n');

  // --- Identificación -------------------------------------------------------------------------
  let organo: string | null = null;
  const mOrg = RE_ORGANO_PREFIJO.exec(cuerpo.slice(0, 120));
  if (mOrg) {
    organo = ORGANOS[mOrg[1]!.toUpperCase()] ?? null;
    cuerpo = cuerpo.slice(mOrg[0].length);
  }
  if (!organo && /^[ÓO]rgano\b/i.test(rec.seccion ?? '')) organo = compactar(rec.seccion);
  if (!organo) organo = organoDeTitular(titular);

  let numeroDocumento: string | null = null;
  let designacion: string | null = null;
  let kind = '';
  let titulo = titular;
  const desT = RE_DESIGNACION.exec(titular.slice(0, 300));
  if (desT) {
    kind = desT[1]!;
    numeroDocumento = desT[3]!;
    const resto = titular.slice(desT[0].length).trim();
    if (resto) titulo = resto;
  }
  // Designación al inicio del cuerpo: "Decreto No. 690.- Ley Especial ..." (se separa del texto)
  let denominacion: string | null = null;
  const desC = RE_DESIGNACION.exec(cuerpo.slice(0, 300));
  if (desC) {
    if (!numeroDocumento) {
      kind = desC[1]!;
      numeroDocumento = desC[3]!;
    }
    if (desC[3] === numeroDocumento) {
      const resto = cuerpo.slice(desC[0].length).replace(/^\s+/, '');
      const primera = dividirOraciones(resto)[0];
      const pos = primera ? resto.indexOf(primera) : -1;
      if (primera && pos >= 0 && primera.length <= 600) {
        // La primera oración tras la designación es el nombre oficial de la norma; se retira del cuerpo.
        denominacion = compactar(primera);
        cuerpo = resto.slice(pos + primera.length);
      } else {
        cuerpo = resto;
      }
    }
  }

  const calificativo = desT?.[2] || desC?.[2] || (rec.categoria === 'DECRETO_LEGISLATIVO' ? 'Legislativo' : '');
  const mayuscula = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  const tipoDoc = kind
    ? `${mayuscula(kind)}${/^decreto$/i.test(kind) && calificativo ? ` ${mayuscula(calificativo)}` : ''}`
    : rec.clasificacionJuridica || ETIQUETA_CATEGORIA[rec.categoria] || 'Publicación Oficial';
  if (numeroDocumento) designacion = `${tipoDoc} No. ${numeroDocumento}`;

  const iso = rec.fecha ?? '';
  const largaFecha = fechaLarga(iso);
  const identificacion: Identificacion = {
    tipo: tipoDoc,
    numeroDocumento,
    designacion,
    titulo,
    organo,
    fechaIso: iso,
    fechaLarga: largaFecha,
    diario: `Tomo ${rec.tomo} · N.° ${rec.numero} · Pág. ${rec.pagina}`
  };

  // Segmentos de cabecera
  segmentos.push({ campo: 'tipo', etiqueta: 'Tipo de documento', texto: tipoDoc, indice: null, cabecera: true });
  if (designacion) segmentos.push({ campo: 'numero', etiqueta: 'Número de documento', texto: designacion, indice: null, cabecera: true });
  if (titulo) segmentos.push({ campo: 'titulo', etiqueta: 'Título', texto: titulo, indice: null, cabecera: true });
  if (organo) segmentos.push({ campo: 'organo', etiqueta: 'Órgano emisor', texto: organo, indice: null, cabecera: true });
  if (iso) segmentos.push({ campo: 'fecha', etiqueta: 'Fecha de publicación', texto: `${largaFecha} (${iso})`, indice: null, cabecera: true });

  // --- Cuerpo ---------------------------------------------------------------------------------
  if (denominacion) {
    segmentos.push({ campo: 'denominacion', etiqueta: 'Denominación oficial', texto: denominacion, indice: null, cabecera: false });
  }
  if (rec.sumario && compactar(rec.sumario)) {
    for (const parte of trocear(compactar(rec.sumario))) {
      segmentos.push({ campo: 'sumario', etiqueta: 'Sumario', texto: parte, indice: null, cabecera: false });
    }
  }

  const parrafos = cuerpo
    .split(/\n[ \t]*\n/)
    .map(compactar)
    .filter((p) => p.length > 0);
  let estado: 'ninguno' | 'considerando' | 'articulo' | 'dispositivo' = 'ninguno';
  let articuloActual = '';
  let considerandoActual = '';
  let numeroParrafo = 0;
  for (const p of parrafos) {
    numeroParrafo++;
    let campo: CampoBusqueda = 'parrafo';
    let etiqueta = `Párrafo ${numeroParrafo}`;
    let texto = p;
    const mArt = RE_ARTICULO.exec(p.slice(0, 40));
    const mSum = RE_SUMARIO.exec(p.slice(0, 20));
    if (mSum) {
      campo = 'sumario';
      etiqueta = 'Sumario';
      texto = p.slice(mSum[0].length) || p;
    } else if (RE_CONSIDERANDO_TITULO.test(p)) {
      estado = 'considerando';
      considerandoActual = '';
      campo = 'considerando';
      etiqueta = 'Considerandos';
    } else if (RE_POR_TANTO.test(p)) {
      estado = 'dispositivo';
      campo = 'dispositivo';
      etiqueta = 'Por tanto';
    } else if (RE_DECRETA.test(p) && p.length < 400) {
      estado = 'dispositivo';
      campo = 'dispositivo';
      etiqueta = 'Parte dispositiva';
    } else if (mArt && /^\s*Art/i.test(p)) {
      estado = 'articulo';
      articuloActual = mArt[1]!.replace(/\s+/g, '');
      campo = 'articulo';
      etiqueta = /^[ÚU]nico$/i.test(articuloActual) ? 'Artículo único' : `Artículo ${articuloActual}`;
    } else if (estado === 'considerando' && RE_ROMANO.test(p)) {
      considerandoActual = RE_ROMANO.exec(p)![1]!;
      campo = 'considerando';
      etiqueta = `Considerando ${considerandoActual}`;
    } else if (/^\s*CONSIDERANDO\b/i.test(p)) {
      estado = 'considerando';
      campo = 'considerando';
      const mR = /^\s*CONSIDERANDO\s*[:.\-–—]?\s*([IVXLC]{1,6})\s*[.\-–—)]/i.exec(p);
      considerandoActual = mR ? mR[1]!.toUpperCase() : '';
      etiqueta = considerandoActual ? `Considerando ${considerandoActual}` : 'Considerandos';
    } else if (estado === 'articulo' && articuloActual) {
      campo = 'articulo';
      etiqueta = /^[ÚU]nico$/i.test(articuloActual) ? 'Artículo único (continuación)' : `Artículo ${articuloActual} (continuación)`;
    } else if (estado === 'considerando') {
      campo = 'considerando';
      etiqueta = considerandoActual ? `Considerando ${considerandoActual} (continuación)` : 'Considerandos';
    }
    const trozos = trocear(texto);
    trozos.forEach((trozo, idx) => {
      segmentos.push({
        campo,
        etiqueta: trozos.length > 1 ? `${etiqueta} (parte ${idx + 1} de ${trozos.length})` : etiqueta,
        texto: trozo,
        indice: numeroParrafo,
        cabecera: false
      });
    });
  }

  const entidades = (rec.nombresClave ?? []).map(compactar).filter(Boolean);
  if (entidades.length > 0) {
    segmentos.push({ campo: 'entidades', etiqueta: 'Entidades vinculadas', texto: entidades.join('; '), indice: null, cabecera: false });
  }
  const sec = compactar(rec.seccion ?? '');
  if (sec && sec !== organo) {
    segmentos.push({ campo: 'seccion', etiqueta: 'Sección del diario', texto: sec, indice: null, cabecera: false });
  }
  return { identificacion, segmentos };
}
