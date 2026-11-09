import type { CategoryType, DiarioRecord, SearchResult } from './types.js';
import { classifyLegalRecord, duiToWords, normalizeDuiInput } from './parser.js';
import { avisoConsultaBusqueda } from './criterio.js';
import { nucleo, type Coincidencia, type ConsultaAnalizada, type Criterio, type DescripcionCriterio, type SegmentoPreparado } from './resaltado.js';
import { PESO_CAMPO, segmentarRegistro, type CampoBusqueda, type Identificacion, type SegmentoDoc } from './segmentos.js';

/**
 * Pliega texto para comparar: minúsculas, sin acentos y con cualquier racha de espacios/saltos
 * de línea reducida a un espacio. Devuelve además el mapa posición plegada -> posición original.
 * (Se conserva por compatibilidad; delega en el núcleo compartido con el navegador.)
 */
export function plegarTexto(texto: string): { plano: string; mapa: number[] } {
  const f = nucleo.plegar(texto);
  return { plano: f.plano, mapa: f.ini };
}

// ------------------------------------------------------------------------------------------------
// Tipos públicos de la búsqueda por campo y párrafo
// ------------------------------------------------------------------------------------------------

export interface Fragmento {
  campo: CampoBusqueda;
  /** Etiqueta visible: "Artículo 3", "Considerando II", "Denominación oficial", "Título"... */
  etiqueta: string;
  /** Número de párrafo del cuerpo (null en campos de cabecera). */
  indice: number | null;
  ubicacion: 'cabecera' | 'cuerpo';
  /** Texto plano del fragmento (la ventana centrada en la coincidencia). */
  texto: string;
  /** Rangos [inicio, fin) de las coincidencias DENTRO de `texto`. */
  rangos: Array<[number, number]>;
  /** HTML seguro: el texto va escapado y solo las coincidencias llevan <mark>. */
  html: string;
  recortadoAntes: boolean;
  recortadoDespues: boolean;
  /** true si el registro entró por el índice de DUI pero el DUI no se halló literalmente en el texto. */
  aproximada: boolean;
}

export interface CabeceraResultado {
  tipoHtml: string;
  numeroHtml: string | null;
  tituloHtml: string;
  organoHtml: string | null;
  fechaHtml: string;
}

export interface DiarioPublico {
  id: string;
  tomo: number;
  numero: number;
  fecha: string;
  pagina: number;
  paginaFin?: number;
  diarioId?: string;
  categoria: CategoryType;
  clasificacionJuridica?: DiarioRecord['clasificacionJuridica'];
  seccion: string;
  titular: string;
  duisEncontrados: string[];
  pdfUrlOficial: string;
  pdfUrlLocal?: string;
}

export interface ResultadoDocumento {
  id: string;
  puntaje: number;
  diario: DiarioPublico;
  identificacion: Identificacion;
  cabecera: CabeceraResultado;
  coincidencias: Fragmento[];
  /** Cantidad de párrafos del cuerpo que coinciden y no se enviaron (solo se envían los mejores). */
  coincidenciasOmitidas: number;
  /** Nombres de los campos donde coincide la búsqueda, p. ej. ["Título", "Párrafo 3"]. */
  camposCoincidentes: string[];
  coincidenciaExacta: boolean;
}

export interface RespuestaBusqueda {
  consulta: { texto: string; criterios: DescripcionCriterio[] };
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
  resultados: ResultadoDocumento[];
  duiNormalized?: string;
  duiWords?: string;
  aviso?: string;
  entradaInvalida?: boolean;
  tiempoMs: number;
}

export interface ParametrosIndice {
  q: string;
  categoria?: string;
  soloDui?: boolean;
  pagina?: number;
  porPagina?: number;
}

interface FormatoMarca {
  clase: string;
  atributos: string;
}

interface SegmentoIndexado {
  def: SegmentoDoc;
  prep: SegmentoPreparado;
}

interface DocumentoIndexado {
  rec: DiarioRecord;
  ident: Identificacion;
  segs: SegmentoIndexado[];
}

interface EvaluacionSegmento {
  seg: SegmentoIndexado;
  hits: Coincidencia[];
  puntaje: number;
}

const MAX_FRAGMENTOS_CUERPO = 4;
const MAX_RANGOS_POR_SEGMENTO = 40;
const VENTANA_COMPLETA = 480;
const VENTANA_ANTES = 140;
const VENTANA_TOTAL = 360;
const MULT_FUERTE = 1.6;

const esFuerte = (c: Criterio): boolean => c.tipo === 'frase' || c.tipo === 'alt' || c.tipo === 'decreto';

export class DiarioIndex {
  private porId: Map<string, DiarioRecord> = new Map();
  private records: DiarioRecord[] = [];
  private docs: DocumentoIndexado[] = [];
  private posicionPorId: Map<string, number> = new Map();
  private duiIndex: Map<string, DiarioRecord[]> = new Map();
  private categoryIndex: Map<CategoryType, DiarioRecord[]> = new Map();
  /** Índice invertido: token plegado -> posiciones (ascendentes) de los documentos que lo contienen. */
  private postings: Map<string, number[]> = new Map();
  private vocabulario: string[] | null = null;
  /** Documento indexado que originó cada resultado (evita buscar por id si hubiera ids repetidos). */
  private origenResultado: WeakMap<object, DocumentoIndexado> = new WeakMap();

  addRecord(record: DiarioRecord): void {
    // Defensa ante datos incompletos: campos nulos, tipos inesperados o listas ausentes no deben tumbar la indexación.
    const texto = (v: unknown): string => (typeof v === 'string' ? v : v == null || typeof v === 'object' ? '' : String(v));
    const lista = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
    record.titular = texto(record.titular);
    record.contenido = texto(record.contenido);
    record.seccion = texto(record.seccion);
    record.duisEncontrados = lista(record.duisEncontrados);
    record.nitsEncontrados = lista(record.nitsEncontrados);
    record.nombresClave = lista(record.nombresClave);
    if (!record.clasificacionJuridica) {
      record.clasificacionJuridica = classifyLegalRecord(record.contenido + ' ' + record.titular, record.categoria);
    }
    this.records.push(record);
    this.porId.set(record.id, record);

    // Segmentación por campo/párrafo y preparación (plegado + tokens) UNA sola vez al indexar.
    const seg = segmentarRegistro(record);
    const pos = this.docs.length;
    const segs: SegmentoIndexado[] = seg.segmentos.map((def) => ({ def, prep: nucleo.preparar(def.texto) }));
    this.docs.push({ rec: record, ident: seg.identificacion, segs });
    this.posicionPorId.set(record.id, pos);
    for (const s of segs) {
      for (const tok of s.prep.toks) {
        let lista = this.postings.get(tok);
        if (!lista) {
          lista = [];
          this.postings.set(tok, lista);
        }
        if (lista[lista.length - 1] !== pos) lista.push(pos);
      }
    }
    this.vocabulario = null;

    // Index by category
    const catList = this.categoryIndex.get(record.categoria) || [];
    catList.push(record);
    this.categoryIndex.set(record.categoria, catList);

    // Index by each DUI found (both canonical 00000000-0 and raw digits 000000000)
    for (const dui of record.duisEncontrados) {
      const cleanDigits = dui.replace(/\D/g, '');
      const canonical = dui.includes('-') ? dui : `${cleanDigits.slice(0, 8)}-${cleanDigits.slice(8)}`;

      const listDigits = this.duiIndex.get(cleanDigits) || [];
      if (!listDigits.some((r) => r.id === record.id)) listDigits.push(record);
      this.duiIndex.set(cleanDigits, listDigits);

      const listCanonical = this.duiIndex.get(canonical) || [];
      if (!listCanonical.some((r) => r.id === record.id)) listCanonical.push(record);
      this.duiIndex.set(canonical, listCanonical);
    }
  }

  addBatch(records: DiarioRecord[]): void {
    for (const r of records) {
      this.addRecord(r);
    }
  }

  // ----------------------------------------------------------------------------------------------
  // Candidatos mediante el índice invertido
  // ----------------------------------------------------------------------------------------------

  private asegurarVocabulario(): string[] {
    if (!this.vocabulario) this.vocabulario = Array.from(this.postings.keys()).sort();
    return this.vocabulario;
  }

  private docsConPrefijo(prefijo: string): Set<number> {
    const vocab = this.asegurarVocabulario();
    let lo = 0;
    let hi = vocab.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (vocab[mid]! < prefijo) lo = mid + 1;
      else hi = mid;
    }
    const out = new Set<number>();
    for (let i = lo; i < vocab.length && vocab[i]!.startsWith(prefijo); i++) {
      for (const d of this.postings.get(vocab[i]!)!) out.add(d);
    }
    return out;
  }

  private docsConToken(token: string): Set<number> {
    return new Set(this.postings.get(token) ?? []);
  }

  private interseccion(conjuntos: Array<Set<number>>): Set<number> {
    if (conjuntos.length === 0) return new Set();
    const orden = [...conjuntos].sort((a, b) => a.size - b.size);
    const out = new Set<number>();
    for (const d of orden[0]!) if (orden.every((s) => s.has(d))) out.add(d);
    return out;
  }

  /** Documentos que pueden cumplir un criterio (verificación posterior por segmento). */
  private candidatosDe(c: Criterio): Set<number> {
    switch (c.tipo) {
      case 'termino':
        return c.pref ? this.docsConPrefijo(c.t) : this.docsConToken(c.t);
      case 'frase':
        return this.interseccion(c.toks.map((t, i) => (i === c.toks.length - 1 && c.pref ? this.docsConPrefijo(t) : this.docsConToken(t))));
      case 'alt': {
        const out = new Set<number>();
        for (const op of c.opciones) for (const d of this.interseccion(op.map((t) => this.docsConToken(t)))) out.add(d);
        return out;
      }
      case 'decreto': {
        const out = this.docsConToken(c.numero);
        for (const k of ['decreto', 'decr', 'dec', 'acuerdo', 'acdo', 'ley', 'd']) for (const d of this.docsConToken(k + c.numero)) out.add(d);
        return out;
      }
    }
  }

  // ----------------------------------------------------------------------------------------------
  // Evaluación y ranking
  // ----------------------------------------------------------------------------------------------

  private evaluar(doc: DocumentoIndexado, criterios: Criterio[]): { puntaje: number; segs: EvaluacionSegmento[] } | null {
    const requeridos = criterios.map((c, i) => (c.req ? i : -1)).filter((i) => i >= 0);
    const cubiertos = new Set<number>();
    const segs: EvaluacionSegmento[] = [];
    for (const seg of doc.segs) {
      const hits = nucleo.localizar(seg.prep, criterios);
      if (hits.length === 0) continue;
      const distintos = new Set<number>();
      for (const h of hits) {
        distintos.add(h.c);
        cubiertos.add(h.c);
      }
      const peso = PESO_CAMPO[seg.def.campo];
      let suma = 0;
      for (const ci of distintos) suma += esFuerte(criterios[ci]!) ? MULT_FUERTE : 1;
      let puntaje = peso * suma + peso * 0.1 * Math.min(hits.length - 1, 5);
      // Todos los criterios requeridos juntos en el mismo párrafo: coincidencia mucho mejor
      if (requeridos.length > 1 && requeridos.every((i) => distintos.has(i))) puntaje *= 1.5;
      segs.push({ seg, hits, puntaje });
    }
    if (!requeridos.every((i) => cubiertos.has(i))) return null;

    segs.sort((a, b) => b.puntaje - a.puntaje);
    let puntaje = segs[0]!.puntaje;
    for (let i = 1; i < segs.length; i++) puntaje += segs[i]!.puntaje * 0.2;
    // Coincidencia exacta con el número oficial del decreto/acuerdo: sube al primer lugar
    const num = doc.ident.numeroDocumento;
    if (num) {
      for (const c of criterios) {
        if (c.req && ((c.tipo === 'decreto' && c.numero === num) || (c.tipo === 'termino' && c.t === num))) puntaje += 150;
      }
    }
    return { puntaje, segs };
  }

  // ----------------------------------------------------------------------------------------------
  // Fragmentos
  // ----------------------------------------------------------------------------------------------

  private construirFragmento(ev: EvaluacionSegmento, formato: FormatoMarca): Fragmento {
    const { def, prep } = ev.seg;
    const texto = prep.texto;
    const cruda = ev.hits.slice(0, MAX_RANGOS_POR_SEGMENTO * 4).map((h): [number, number] => [h.a, h.b]);
    const unidos = nucleo.unirRangos(cruda, texto).slice(0, MAX_RANGOS_POR_SEGMENTO);

    let ini = 0;
    let fin = texto.length;
    const ancla = ev.hits.find((h) => h.fuerte) ?? ev.hits[0];
    if (texto.length > VENTANA_COMPLETA && !ancla) {
      // Sin coincidencia literal (registro hallado por el índice de DUI): se muestra el comienzo del párrafo
      fin = VENTANA_TOTAL;
      const sp = texto.indexOf(' ', fin);
      fin = sp >= 0 && sp - fin < 40 ? sp : fin;
    } else if (texto.length > VENTANA_COMPLETA && ancla) {
      ini = Math.max(0, ancla.a - VENTANA_ANTES);
      fin = Math.min(texto.length, Math.max(ini + VENTANA_TOTAL, ancla.b + 60));
      if (ini > 0) {
        const sp = texto.indexOf(' ', ini);
        if (sp >= 0 && sp < ancla.a) ini = sp + 1;
      }
      if (fin < texto.length) {
        // Cierra la ventana al final de la palabra; si no queda ningún espacio, al final del texto (nunca a mitad de palabra).
        const sp = texto.indexOf(' ', fin);
        const cierre = sp >= 0 ? sp : texto.length;
        fin = cierre - fin < 40 ? cierre : fin;
      }
    }
    const rangos: Array<[number, number]> = [];
    for (const [a, b] of unidos) {
      const x = Math.max(a, ini);
      const y = Math.min(b, fin);
      if (y > x) rangos.push([x - ini, y - ini]);
    }
    const trozo = texto.slice(ini, fin);
    return {
      campo: def.campo,
      etiqueta: def.etiqueta,
      indice: def.indice,
      ubicacion: def.cabecera ? 'cabecera' : 'cuerpo',
      texto: trozo,
      rangos,
      html: nucleo.resaltarHtml(trozo, rangos, formato.clase, formato.atributos),
      recortadoAntes: ini > 0,
      recortadoDespues: fin < texto.length,
      aproximada: false
    };
  }

  private fragmentoSinCoincidencia(doc: DocumentoIndexado): Fragmento | null {
    const cuerpo = doc.segs.filter((s) => !s.def.cabecera);
    const preferido = cuerpo.find((s) => /identidad|\bdui\b|documento unico/i.test(nucleo.plegar(s.def.texto).plano)) ?? cuerpo[0];
    if (!preferido) return null;
    const f = this.construirFragmento({ seg: preferido, hits: [], puntaje: 0 }, { clase: 'gs-mark', atributos: '' });
    f.aproximada = true;
    return f;
  }

  private cabeceraDe(doc: DocumentoIndexado, evs: EvaluacionSegmento[], formato: FormatoMarca): CabeceraResultado {
    const html = (campo: CampoBusqueda, texto: string): string => {
      const ev = evs.find((e) => e.seg.def.campo === campo);
      if (!ev) return nucleo.escapar(texto);
      return this.construirFragmento(ev, formato).html;
    };
    const id = doc.ident;
    return {
      tipoHtml: html('tipo', id.tipo),
      numeroHtml: id.designacion ? html('numero', id.designacion) : null,
      tituloHtml: html('titulo', id.titulo),
      organoHtml: id.organo ? html('organo', id.organo) : null,
      fechaHtml: html('fecha', `${id.fechaLarga} (${id.fechaIso})`)
    };
  }

  private publico(rec: DiarioRecord): DiarioPublico {
    return {
      id: rec.id,
      tomo: rec.tomo,
      numero: rec.numero,
      fecha: rec.fecha,
      pagina: rec.pagina,
      paginaFin: rec.paginaFin,
      diarioId: rec.diarioId ?? rec.fecha,
      categoria: rec.categoria,
      clasificacionJuridica: rec.clasificacionJuridica,
      seccion: rec.seccion,
      titular: rec.titular,
      duisEncontrados: rec.duisEncontrados,
      pdfUrlOficial: rec.pdfUrlOficial,
      pdfUrlLocal: rec.pdfUrlLocal
    };
  }

  // ----------------------------------------------------------------------------------------------
  // Búsqueda
  // ----------------------------------------------------------------------------------------------

  buscar(params: ParametrosIndice, formatoMarca?: (rec: DiarioRecord) => FormatoMarca): RespuestaBusqueda {
    const t0 = performance.now();
    const entero = (v: unknown, defecto: number): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(1, Math.floor(v)) : defecto);
    const porPagina = entero(params.porPagina, 10);
    const pagina = entero(params.pagina, 1);
    const base = (extra: Partial<RespuestaBusqueda> & { texto?: string; criterios?: DescripcionCriterio[] }): RespuestaBusqueda => {
      const { texto, criterios, ...resto } = extra;
      return {
        consulta: { texto: texto ?? '', criterios: criterios ?? [] },
        total: 0,
        pagina,
        porPagina,
        totalPaginas: 0,
        resultados: [],
        tiempoMs: Math.round((performance.now() - t0) * 100) / 100,
        ...resto
      };
    };

    const q = String(params.q ?? '').replace(/\s+/g, ' ').trim();
    if (!q) return base({ aviso: 'Escribe un DUI, un nombre, un número de decreto o una frase para buscar en el archivo.', entradaInvalida: true });
    if (q.length > nucleo.LIM.maxChars) {
      return base({ aviso: `La consulta admite ${nucleo.LIM.maxChars} caracteres como máximo. Acórtala y vuelve a intentar.`, entradaInvalida: true });
    }

    const duiInfo = normalizeDuiInput(q);
    const analisis: ConsultaAnalizada = nucleo.analizar(q, undefined, duiInfo.isValidDui ? duiInfo.cleanDigits : undefined);

    // La entrada es inválida (no es una consulta real): la interfaz debe mostrar el error
    // de validación y jamás «Sin publicaciones oficiales».
    // Etiquetas HTML, solo símbolos o «DUI» con letras (p. ej. abcdefgh-1) tampoco son consultas reales (R3-003).
    const avisoForma = avisoConsultaBusqueda(q);
    let aviso: string | undefined;
    if (duiInfo.incomplete) {
      aviso = 'El número escrito está incompleto: un DUI tiene 9 dígitos (8 más el dígito verificador). Complétalo para una búsqueda por DUI confiable.';
    } else if (duiInfo.isValidDui && duiInfo.checkDigitOk === false) {
      aviso = 'El dígito verificador de este DUI no es válido. Revisa que lo hayas escrito bien.';
    } else if (q.length < 3) {
      aviso = 'Escribe al menos 3 caracteres para buscar por nombre.';
    } else if (avisoForma) {
      aviso = avisoForma;
    } else if (!analisis.ok) {
      aviso = analisis.error;
    }
    // Consulta imposible de ejecutar (muy corta, con etiquetas, sin términos útiles): no se busca nada.
    // DUI incompleto o con verificador erróneo: se busca igualmente, pero la interfaz muestra el aviso en lugar de «sin publicaciones».
    if (!analisis.ok || q.length < 3 || avisoForma) return base({ aviso, entradaInvalida: true, texto: q });

    const criterios = analisis.criterios;
    const categoria = params.categoria;
    const duiValido = duiInfo.isValidDui;

    // Registros del índice de DUI (entran aunque el DUI esté escrito de otra forma en el texto)
    const porDui = new Set<number>();
    if (duiValido) {
      for (const r of [...(this.duiIndex.get(duiInfo.canonical) ?? []), ...(this.duiIndex.get(duiInfo.cleanDigits) ?? [])]) {
        const pos = this.posicionPorId.get(r.id);
        if (pos !== undefined) porDui.add(pos);
      }
    }

    let candidatos: Set<number>;
    if (params.soloDui && duiValido) {
      candidatos = porDui;
    } else {
      const req = criterios.filter((c) => c.req).map((c) => this.candidatosDe(c));
      candidatos = this.interseccion(req);
      for (const p of porDui) candidatos.add(p);
    }

    const filtrados: Array<{ doc: DocumentoIndexado; ev: { puntaje: number; segs: EvaluacionSegmento[] } | null; exacta: boolean }> = [];
    for (const pos of candidatos) {
      const doc = this.docs[pos]!;
      if (categoria && doc.rec.categoria !== categoria) continue;
      const ev = this.evaluar(doc, criterios);
      const exacta = porDui.has(pos);
      if (!ev && !exacta) continue;
      filtrados.push({ doc, ev, exacta });
    }
    filtrados.sort((a, b) => {
      if (a.exacta !== b.exacta) return a.exacta ? -1 : 1;
      const d = (b.ev?.puntaje ?? 0) - (a.ev?.puntaje ?? 0);
      if (d !== 0) return d;
      if (a.doc.rec.fecha !== b.doc.rec.fecha) return a.doc.rec.fecha < b.doc.rec.fecha ? 1 : -1;
      if (a.doc.rec.pagina !== b.doc.rec.pagina) return a.doc.rec.pagina - b.doc.rec.pagina;
      return a.doc.rec.id < b.doc.rec.id ? -1 : a.doc.rec.id > b.doc.rec.id ? 1 : 0;
    });

    const total = filtrados.length;
    const totalPaginas = Math.ceil(total / porPagina);
    const pagina_ = filtrados.slice((pagina - 1) * porPagina, pagina * porPagina);
    const resultados: ResultadoDocumento[] = pagina_.map(({ doc, ev, exacta }) => {
      const formato = formatoMarca ? formatoMarca(doc.rec) : { clase: 'gs-mark', atributos: '' };
      const evs = ev?.segs ?? [];
      const cabeceraEv = evs.filter((e) => e.seg.def.cabecera);
      const cuerpoEv = evs.filter((e) => !e.seg.def.cabecera);
      // Se eligen los mejores párrafos por puntaje, pero se muestran en el orden del documento.
      const elegidosCuerpo = cuerpoEv.slice(0, MAX_FRAGMENTOS_CUERPO).sort((a, b) => doc.segs.indexOf(a.seg) - doc.segs.indexOf(b.seg));
      const coincidencias = [...cabeceraEv, ...elegidosCuerpo].map((e) => this.construirFragmento(e, formato));
      if (coincidencias.length === 0) {
        const f = this.fragmentoSinCoincidencia(doc);
        if (f) coincidencias.push(f);
      }
      const resultado: ResultadoDocumento = {
        id: doc.rec.id,
        puntaje: Math.round((ev?.puntaje ?? 0) * 10) / 10,
        diario: this.publico(doc.rec),
        identificacion: doc.ident,
        cabecera: this.cabeceraDe(doc, cabeceraEv, formato),
        coincidencias,
        coincidenciasOmitidas: Math.max(0, cuerpoEv.length - elegidosCuerpo.length),
        camposCoincidentes: [...cabeceraEv, ...cuerpoEv].map((e) => e.seg.def.etiqueta),
        coincidenciaExacta: exacta
      };
      this.origenResultado.set(resultado, doc);
      return resultado;
    });

    return base({
      texto: q,
      criterios: analisis.descripcion,
      total,
      totalPaginas,
      resultados,
      duiNormalized: duiValido ? duiInfo.canonical : undefined,
      duiWords: duiValido ? duiToWords(duiInfo.canonical) : undefined,
      aviso,
      entradaInvalida: aviso ? true : undefined
    });
  }

  /**
   * Interfaz histórica (resultado plano con `snippet`). Se apoya en la búsqueda por campo y párrafo:
   * el snippet es el mejor párrafo coincidente, con el texto escapado y las marcas clicables del visor.
   */
  search(query: string, categoryFilter?: string, forceDuiOnly?: boolean): SearchResult & { duiNormalized?: string; duiWords?: string; aviso?: string; entradaInvalida?: boolean } {
    const termino = String(query ?? '').replace(/[^\p{L}\p{N} .\-]/gu, '').slice(0, 60);
    const r = this.buscar(
      { q: query, categoria: categoryFilter, soloDui: forceDuiOnly, pagina: 1, porPagina: Number.MAX_SAFE_INTEGER },
      (rec) => ({
        clase: 'highlight-clickable gs-mark',
        atributos: ` onclick="openEbookViewer(${Math.trunc(Number(rec.pagina)) || 1}, '${termino}')" title="Clic para abrir el Visor Ebook en Pág. ${Math.trunc(Number(rec.pagina)) || 1} y resaltar en el PDF original"`
      })
    );
    return {
      total: r.total,
      results: r.resultados.map((x) => {
        const f = x.coincidencias.find((c) => c.ubicacion === 'cuerpo') ?? x.coincidencias[0];
        return {
          diario: this.origenResultado.get(x)?.rec ?? this.porId.get(x.id)!,
          snippet: f ? `${f.recortadoAntes ? '...' : ''}${f.html}${f.recortadoDespues ? '...' : ''}` : '',
          coincidenciaExacta: x.coincidenciaExacta
        };
      }),
      duiNormalized: r.duiNormalized,
      duiWords: r.duiWords,
      aviso: r.aviso,
      entradaInvalida: r.entradaInvalida
    };
  }

  getRecentByCategory(category: CategoryType, limit = 10): DiarioRecord[] {
    const list = this.categoryIndex.get(category) || [];
    return list.slice(0, limit);
  }

  getById(id: string): DiarioRecord | undefined {
    return this.porId.get(id);
  }

  getAllRecords(): DiarioRecord[] {
    return this.records;
  }

  count(): number {
    return this.records.length;
  }
}
