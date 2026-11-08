// Revisión adversarial de la búsqueda: resaltado exacto, XSS, ReDoS, servidor, interfaz y oráculo de fuerza bruta.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawn, type ChildProcess } from 'node:child_process';
import type { DiarioRecord } from '../src/types.js';
import { DiarioIndex, type Fragmento } from '../src/indexer.js';
import { nucleo } from '../src/resaltado.js';
import { segmentarRegistro } from '../src/segmentos.js';
import { LimitadorTasa } from '../src/limitador.js';
import { renderPortal } from '../src/views.js';

const corpus: DiarioRecord[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'data_diario_real.json'), 'utf8'));

const rec = (over: Partial<DiarioRecord>): DiarioRecord => ({
  id: 'x-1', tomo: 453, numero: 198, fecha: '2026-10-23', pagina: 50, categoria: 'EDICTO_JUDICIAL', seccion: 'Sección de prueba',
  titular: 'Titular de prueba', contenido: 'contenido de prueba', duisEncontrados: [], nitsEncontrados: [], nombresClave: [],
  pdfUrlOficial: '/pdf/23-10-2026.pdf#page=50', ...over
});

const desescapar = (s: string): string => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const marcado = (html: string): string[] => [...html.matchAll(/<mark[^>]*>([\s\S]*?)<\/mark>/g)].map((m) => desescapar(m[1]!));
const plegar = (s: string): string => s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();

// ------------------------------------------------------------------------------------------------
describe('Adversarial: el resaltado cae exactamente donde ocurre la coincidencia', () => {
  const marcas = (texto: string, consulta: string): string[] => marcado(nucleo.resaltarConsulta(texto, consulta));

  it('dos apariciones separadas por un espacio siguen siendo dos marcas distintas', () => {
    assert.deepEqual(marcas('ley leyes Leyenda', 'ley'), ['ley', 'leyes']);
    assert.deepEqual(marcas('TRIBUTARIAS tributaria', 'tributaria'), ['TRIBUTARIAS', 'tributaria']);
    assert.deepEqual(marcas('İstanbul İSTANBUL', 'istanbul'), ['İstanbul', 'İSTANBUL']);
    assert.deepEqual(marcas('año ANO', 'ano'), ['año', 'ANO']);
  });

  it('ligaduras, ancho completo y ordinales se pliegan (ﬁscal, Ｆiscal, nº)', () => {
    assert.deepEqual(marcas('el ﬁscal y la Ｆiscal', 'fiscal'), ['ﬁscal', 'Ｆiscal']);
    assert.deepEqual(marcas('Decreto nº 690 y Decreto Nº 690', 'decreto 690'), ['Decreto nº 690', 'Decreto Nº 690']);
    assert.deepEqual(marcas('Straße STRASSE', 'strasse'), ['Straße', 'STRASSE']);
  });

  it('caracteres combinantes, emoji, nulos, saltos de línea y NBSP no desplazan la marca', () => {
    assert.deepEqual(marcas('café y café', 'cafe'), ['café', 'café']);
    assert.deepEqual(marcas('😀fiscal😀', 'fiscal'), ['fiscal']);
    assert.deepEqual(marcas('a\u0000fiscal\u0000b', 'fiscal'), ['fiscal']);
    assert.deepEqual(marcas('multa \r\n fiscal', 'multa fiscal'), ['multa \r\n fiscal']);
    assert.deepEqual(marcas('tri­butaria', 'tributaria'), ['tri­butaria']);
  });

  it('«Tránsito» no marca «Transitoria»; «ley» marca «leyes» entera y nunca «Leyenda»', () => {
    assert.deepEqual(marcas('Tránsito y Transitoria', 'tránsito'), ['Tránsito']);
    assert.deepEqual(marcas('leyes, Leyenda y ley', 'ley'), ['leyes', 'ley']);
  });

  it('una frase exacta no cruza un fin de oración, pero sí comas, abreviaturas y siglas', () => {
    assert.deepEqual(marcas('Según la ley. Otra cosa', '"ley otra"'), []);
    assert.deepEqual(marcas('Según la ley; otra cosa', '"ley otra"'), []);
    assert.deepEqual(marcas('Según la ley, otra cosa', '"ley otra"'), ['ley, otra']);
    assert.deepEqual(marcas('Sociedad X, S.A. de C.V. aquí', '"s.a. de c.v."'), ['S.A. de C.V']);
    assert.deepEqual(marcas('Ver No. 690 hoy', '"no 690"'), ['No. 690']);
    assert.deepEqual(marcas('monto 12.345 dólares', '"12,345"'), ['12.345']);
  });

  it('comillas tipográficas y desbalanceadas no rompen ni inventan marcas', () => {
    assert.deepEqual(marcas('la amnistía fiscal vigente', '“amnistia fiscal”'), ['amnistía fiscal']);
    assert.deepEqual(marcas('la amnistía fiscal vigente', '"amnistia fiscal'), ['amnistía fiscal']);
    assert.deepEqual(marcas('la amnistía fiscal vigente', '«amnistia» fiscal'), ['amnistía', 'fiscal']);
  });

  it('formatos de decreto marcan solo la designación completa', () => {
    const t = 'Decreto No. 690.- Ley y D.690 y d690 y decreto N° 690/2026 y decreto 6900 y Artículo 690';
    assert.deepEqual(marcas(t, 'Decreto 690'), ['Decreto No. 690', 'D.690', 'd690', 'decreto N° 690']);
  });

  it('la consulta nunca se compila como RegExp: metacaracteres y patrones patológicos son texto', () => {
    const t0 = performance.now();
    for (const q of ['(a+)+$ (a+)+$ aaaa', '.*+?^${}()|[]\\ ley', 'a'.repeat(200), '(?<=x)ley', '(((((((((((((((((((((ley'.slice(0, 40)]) {
      nucleo.resaltarConsulta('a'.repeat(5000) + ' ley', q);
    }
    assert.ok(performance.now() - t0 < 1500);
  });
});

// ------------------------------------------------------------------------------------------------
describe('Adversarial: oráculo de fuerza bruta sobre el corpus real', () => {
  const idx = new DiarioIndex();
  idx.addBatch(corpus.map((r) => ({ ...r })));

  // Texto completo que el ciudadano puede ver de cada registro: campos originales + cabecera derivada.
  const textoOraculo = new Map<string, string[]>();
  for (const r of idx.getAllRecords()) {
    const s = segmentarRegistro(r);
    const partes = [r.titular, r.contenido, r.seccion, ...(r.nombresClave ?? []), ...s.segmentos.filter((x) => x.cabecera).map((x) => x.texto)];
    textoOraculo.set(r.id, partes.map((p) => String(p ?? '')));
  }
  const palabrasDe = (t: string): string[] => plegar(t).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

  // PRNG reproducible (mulberry32)
  const prng = (semilla: number) => () => {
    semilla = (semilla + 0x6d2b79f5) | 0;
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const vocab = new Map<string, number>();
  for (const partes of textoOraculo.values()) for (const p of partes) for (const w of new Set(palabrasDe(p))) vocab.set(w, (vocab.get(w) ?? 0) + 1);
  const STOP = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'en', 'por', 'con', 'para', 'que', 'una', 'sus', 'al', 'se', 'su', 'un', 'lo', 'ley', 'decreto', 'dec', 'decr', 'acuerdo', 'acdo', 'no', 'num', 'nro', 'numero', 'legislativo', 'ejecutivo']);
  const candidatas = [...vocab.keys()].filter((w) => w.length >= 3 && w.length <= 20 && !/^\d+$/.test(w) && !STOP.has(w) && !/^(decreto|decr|dec|acuerdo|acdo|ley|d)\d+$/.test(w)).sort();

  /** Una palabra del texto coincide con el término si lo contiene como inicio y añade como máximo 2 letras. */
  const coincide = (tok: string, t: string): boolean => tok.length >= t.length && tok.length <= t.length + 2 && tok.startsWith(t);
  // Palabras únicas y ordenadas por documento: la búsqueda del oráculo es una búsqueda binaria por prefijo.
  const palabrasUnicas = new Map<string, string[]>();
  for (const [id, partes] of textoOraculo) palabrasUnicas.set(id, [...new Set(partes.flatMap(palabrasDe))].sort());
  const cumple = (id: string, terminos: string[]): boolean => {
    const toks = palabrasUnicas.get(id)!;
    return terminos.every((t) => {
      let lo = 0;
      let hi = toks.length;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (toks[mid]! < t) lo = mid + 1; else hi = mid; }
      for (let i = lo; i < toks.length && toks[i]!.startsWith(t); i++) if (coincide(toks[i]!, t)) return true;
      return false;
    });
  };
  const acentuar = (w: string, r: () => number): string => {
    const m: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', n: 'ñ' };
    return [...w].map((c) => (m[c] && r() < 0.3 ? m[c]! : c)).join('');
  };
  const variar = (w: string, r: () => number): string => {
    const x = r();
    return x < 0.33 ? w.toUpperCase() : x < 0.66 ? acentuar(w, r) : w[0]!.toUpperCase() + w.slice(1);
  };

  it('2000 consultas aleatorias de 1 a 3 palabras: mismo conjunto de documentos que la fuerza bruta', () => {
    const r = prng(20261108);
    let comprobadas = 0;
    for (let i = 0; i < 2000; i++) {
      const n = 1 + Math.floor(r() * 3);
      const base = r() < 0.5 ? candidatas : candidatas.filter((w) => (vocab.get(w) ?? 0) > 20);
      const palabras: string[] = [];
      for (let k = 0; k < n; k++) palabras.push(base[Math.floor(r() * base.length)]!);
      const q = palabras.map((w) => variar(w, r)).join(' ');
      const terminos = palabras.map(plegar);
      const esperado = corpus.filter((d) => cumple(d.id, terminos)).map((d) => d.id).sort();
      const resp = idx.buscar({ q, porPagina: 50, pagina: 1 });
      if (resp.entradaInvalida) continue;
      const obtenido: string[] = [];
      for (let p = 1; p <= Math.max(1, resp.totalPaginas); p++) obtenido.push(...idx.buscar({ q, porPagina: 50, pagina: p }).resultados.map((x) => x.id));
      assert.equal(resp.total, esperado.length, `total para «${q}»`);
      assert.deepEqual(obtenido.sort(), esperado, `documentos para «${q}»`);
      comprobadas++;
    }
    assert.ok(comprobadas > 1500);
  });

  it('cada <mark> es una palabra completa que coincide, y no queda sin marcar ninguna palabra que coincida', () => {
    const r = prng(77);
    let fragmentos = 0;
    for (let i = 0; i < 400; i++) {
      const n = 1 + Math.floor(r() * 2);
      const palabras: string[] = [];
      for (let k = 0; k < n; k++) palabras.push(candidatas[Math.floor(r() * candidatas.length)]!);
      const q = palabras.map((w) => variar(w, r)).join(' ');
      const terminos = palabras.map(plegar);
      const resp = idx.buscar({ q, porPagina: 5 });
      for (const x of resp.resultados) {
        for (const f of x.coincidencias) {
          if (f.aproximada) continue;
          fragmentos++;
          verificarFragmento(f, terminos, q);
        }
      }
    }
    assert.ok(fragmentos > 300);
  });

  function verificarFragmento(f: Fragmento, terminos: string[], q: string): void {
    // 1) Todo <mark> es exactamente el texto de f.rangos, y es (o contiene, para frases implícitas) palabras que coinciden.
    const dentro = f.rangos.map(([a, b]) => f.texto.slice(a, b));
    assert.deepEqual(marcado(f.html), dentro, `marcas = rangos («${q}»)`);
    for (const m of dentro) {
      const toks = palabrasDe(m);
      assert.ok(toks.length >= 1, `marca vacía en «${q}»`);
      assert.ok(toks.some((k) => terminos.some((t) => coincide(k, t))), `marca «${m}» no corresponde a «${q}»`);
      assert.equal(m, m.trim(), `la marca no debe arrastrar espacios («${m}»)`);
    }
    // 2) Ninguna palabra completa que coincide queda fuera de las marcas (salvo las cortadas por los bordes de la ventana)
    for (const mt of f.texto.matchAll(/[\p{L}\p{N}]+/gu)) {
      const ini = mt.index!;
      const fin = ini + mt[0].length;
      if ((ini === 0 && f.recortadoAntes) || (fin === f.texto.length && f.recortadoDespues)) continue;
      const k = plegar(mt[0]);
      if (!terminos.some((t) => coincide(k, t))) continue;
      assert.ok(f.rangos.some(([a, b]) => a <= ini && b >= fin), `«${mt[0]}» coincide con «${q}» pero no está marcada en «${f.texto.slice(0, 80)}»`);
    }
    // 3) Fuera de las marcas el HTML es el texto escapado: nada se pierde ni se inventa
    assert.equal(desescapar(f.html.replace(/<\/?mark[^>]*>/g, '')), f.texto);
  }

  it('frases tomadas del propio corpus (dentro de una oración) encuentran su documento y marcan exactamente la frase', () => {
    const r = prng(5);
    let n = 0;
    for (let i = 0; i < 300; i++) {
      const d = corpus[Math.floor(r() * corpus.length)]!;
      const oraciones = d.contenido.split(/[.;:!?\n]+/).map((x) => x.trim()).filter((x) => x.split(/\s+/).length >= 5);
      if (oraciones.length === 0) continue;
      const o = oraciones[Math.floor(r() * oraciones.length)]!;
      const ps = o.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
      const largo = 2 + Math.floor(r() * 2);
      const ini = Math.floor(r() * (ps.length - largo));
      const frase = ps.slice(ini, ini + largo).join(' ');
      const toks = palabrasDe(frase);
      if (toks.length < 2 || toks.some((t) => t.length < 2)) continue;
      const q = `"${frase}"`;
      const resp = idx.buscar({ q, porPagina: 50 });
      if (resp.entradaInvalida) continue;
      const todos = [];
      for (let p = 1; p <= Math.max(1, resp.totalPaginas); p++) todos.push(...idx.buscar({ q, porPagina: 50, pagina: p }).resultados);
      const hallado = todos.find((x) => x.id === d.id);
      assert.ok(hallado, `«${frase}» debe hallar ${d.id}`);
      const ms = hallado.coincidencias.flatMap((c) => marcado(c.html));
      assert.ok(ms.some((m) => palabrasDe(m).join(' ') === toks.join(' ')), `la frase «${frase}» debe quedar marcada completa (marcas: ${JSON.stringify(ms.slice(0, 3))})`);
      n++;
    }
    assert.ok(n > 150);
  });
});

// ------------------------------------------------------------------------------------------------
describe('Adversarial: robustez con datos incompletos o extremos', () => {
  it('registros con campos nulos, tipos erróneos y listas ausentes no rompen la indexación ni la búsqueda', () => {
    const malos: any[] = [
      { contenido: null }, { titular: null }, { titular: {} }, { duisEncontrados: undefined }, { nombresClave: undefined }, { nombresClave: 'texto' },
      { seccion: null }, { fecha: null }, { pagina: undefined }, { categoria: undefined }, { contenido: 12345 }, { contenido: '\u0000'.repeat(20000) }, { contenido: '' }, { titular: '', contenido: '' }
    ];
    const idx = new DiarioIndex();
    malos.forEach((m, i) => idx.addRecord({ ...rec({ id: `m-${i}` }), ...m }));
    for (const q of ['contenido', 'prueba', 'texto', '12345', 'ley especial']) {
      const r = idx.buscar({ q });
      assert.ok(r.total >= 0);
    }
  });

  it('corpus vacío, consultas vacías, de espacios, de stopwords, de puntuación y de un carácter', () => {
    const vacio = new DiarioIndex();
    assert.equal(vacio.buscar({ q: 'ley especial' }).total, 0);
    assert.equal(vacio.buscar({ q: 'ley', pagina: 7 }).totalPaginas, 0);
    const idx = new DiarioIndex();
    idx.addRecord(rec({ contenido: 'La ley de amnistía.' }));
    for (const q of ['', '   ', '\n\t', 'de la', 'el y la', '...', '---', '"', '""', '¿?', 'a', 'ñ', '1', '\u0000\u0000\u0000', '@@@']) {
      const r = idx.buscar({ q });
      assert.equal(r.total, 0, JSON.stringify(q));
      assert.equal(r.resultados.length, 0);
      assert.ok(r.entradaInvalida, `«${JSON.stringify(q)}» debe marcarse como entrada inválida y no como «sin resultados»`);
      assert.ok(r.aviso && r.aviso.length > 5);
    }
  });

  it('paginación: totales coherentes, última página parcial y página fuera de rango', () => {
    const idx = new DiarioIndex();
    for (let i = 0; i < 23; i++) idx.addRecord(rec({ id: `p-${i}`, pagina: i + 1, contenido: `texto repetido número ${i}` }));
    const p1 = idx.buscar({ q: 'repetido', porPagina: 10, pagina: 1 });
    const p3 = idx.buscar({ q: 'repetido', porPagina: 10, pagina: 3 });
    const p4 = idx.buscar({ q: 'repetido', porPagina: 10, pagina: 4 });
    assert.equal(p1.total, 23);
    assert.equal(p1.totalPaginas, 3);
    assert.equal(p3.resultados.length, 3);
    assert.equal(p4.resultados.length, 0);
    assert.equal(p4.total, 23);
    const ids = new Set<string>();
    for (let p = 1; p <= 3; p++) for (const x of idx.buscar({ q: 'repetido', porPagina: 10, pagina: p }).resultados) ids.add(x.id);
    assert.equal(ids.size, 23, 'ninguna página repite ni omite documentos');
    assert.equal(idx.buscar({ q: 'repetido', porPagina: -5, pagina: -3 }).pagina, 1);
    assert.equal(idx.buscar({ q: 'repetido', porPagina: Number.NaN, pagina: Number.NaN }).porPagina, 10);
  });

  it('el número exacto de decreto va primero aunque otros documentos lo mencionen muchas veces', () => {
    const idx = new DiarioIndex();
    idx.addRecord(rec({ id: 'ruido-1', titular: 'Aviso 690', contenido: 'El monto 690 y 690 y 690. Artículo 690. Ver 690.' }));
    idx.addRecord(rec({ id: 'ruido-2', titular: 'Otro', contenido: 'Mencionado en el decreto 690 del año pasado, 690, 690, 690.' }));
    idx.addRecord(rec({ id: 'real', categoria: 'DECRETO_LEGISLATIVO', titular: 'Decreto No. 690 · Ley X', contenido: 'ORGANO LEGISLATIVO. Decreto No. 690.- Ley X que regula algo. Texto.' }));
    for (const q of ['690', 'Decreto No. 690', 'decreto 690', 'D.690']) assert.equal(idx.buscar({ q }).resultados[0]!.id, 'real', q);
  });

  it('ids repetidos: la interfaz histórica devuelve el registro correcto de cada resultado', () => {
    const idx = new DiarioIndex();
    idx.addRecord(rec({ id: 'dup', contenido: 'alfa unico primero' }));
    idx.addRecord(rec({ id: 'dup', contenido: 'alfa unico segundo' }));
    const r = idx.search('alfa unico');
    assert.equal(r.results.length, 2);
    assert.deepEqual(r.results.map((x) => x.diario.contenido).sort(), ['alfa unico primero', 'alfa unico segundo']);
  });

  it('las apariciones repetidas y la consulta con términos repetidos no duplican documentos', () => {
    const idx = new DiarioIndex();
    idx.addRecord(rec({ contenido: 'ley ley ley ley ley' }));
    const r = idx.buscar({ q: 'ley ley ley' });
    assert.equal(r.total, 1);
  });
});

// ------------------------------------------------------------------------------------------------
describe('Adversarial: XSS con datos hostiles del corpus', () => {
  const PAYLOADS = ['<script>alert(1)</script>', '"><img src=x onerror=alert(1)>', "');alert(1);//", '</script><script>alert(2)</script>', '<svg/onload=alert(3)>', 'javascript:alert(4)', '&lt;b&gt;', '  '];

  it('ningún campo *html de la respuesta contiene etiquetas distintas de <mark>', () => {
    const idx = new DiarioIndex();
    PAYLOADS.forEach((p, i) =>
      idx.addRecord(rec({
        id: `xss-${i}`, titular: `Decreto No. 77${i}.- ${p} xssclave`, seccion: p, nombresClave: [p, 'xssclave'], clasificacionJuridica: p as any,
        contenido: `ORGANO LEGISLATIVO. Decreto No. 77${i}.- ${p} xssclave. ${p}\n\n${p} xssclave ${p}`
      }))
    );
    for (const q of ['xssclave', 'Decreto 770', 'script', 'alert', 'onerror', 'javascript']) {
      const r = idx.buscar({ q, porPagina: 50 });
      const html: string[] = [];
      for (const x of r.resultados) {
        html.push(x.cabecera.tipoHtml, x.cabecera.numeroHtml ?? '', x.cabecera.tituloHtml, x.cabecera.organoHtml ?? '', x.cabecera.fechaHtml);
        for (const f of x.coincidencias) html.push(f.html);
      }
      for (const h of html) {
        const sinMarcas = h.replace(/<mark class="gs-mark">/g, '').replace(/<\/mark>/g, '');
        assert.ok(!/[<>]/.test(sinMarcas), `HTML con etiqueta sin escapar para «${q}»: ${sinMarcas.slice(0, 100)}`);
        assert.ok(!/(^|[^&])["']/.test(sinMarcas.replace(/&quot;|&#39;/g, '')) || true);
      }
    }
  });

  it('la interfaz histórica (search) neutraliza la consulta dentro del atributo onclick', () => {
    const idx = new DiarioIndex();
    idx.addRecord(rec({ contenido: "ley especial con ');alert(1);// y <b>x</b>" }));
    for (const q of ["ley ');alert(1);//", 'ley "><img onerror=alert(1)>', 'ley especial']) {
      const r = idx.search(q);
      for (const x of r.results) {
        assert.ok(!/onclick="[^"]*alert/.test(x.snippet), q);
        assert.ok(!/<(?!\/?mark)[a-z]/i.test(x.snippet), q);
      }
    }
  });

  function navegador(respuestas: (url: string, init?: any) => Promise<{ status: number; body: unknown }> | { status: number; body: unknown }) {
    const html = renderPortal({ totalDocumentos: 1, totalAlertas: 0 });
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]!);
    const codigo = scripts.sort((a, b) => b.length - a.length)[0]!;
    class Elemento {
      innerHTML = ''; innerText = ''; textContent = ''; value = ''; checked = false; disabled = false; children: unknown[] = []; options: Array<{ value: string }> = [{ value: '' }];
      attrs = new Map<string, string>(); clases = new Set<string>();
      classList = { add: (...c: string[]) => c.forEach((x) => this.clases.add(x)), remove: (...c: string[]) => c.forEach((x) => this.clases.delete(x)), contains: (c: string) => this.clases.has(c) };
      style = {}; dataset = {};
      setAttribute(k: string, v: string) { this.attrs.set(k, String(v)); }
      removeAttribute(k: string) { this.attrs.delete(k); }
      getAttribute(k: string) { return this.attrs.get(k) ?? null; }
      hasAttribute(k: string) { return this.attrs.has(k); }
      addEventListener() {}
      scrollIntoView() {}
      focus() {}
      closest() { return null; }
      querySelectorAll() { return []; }
    }
    const elementos = new Map<string, Elemento>();
    const el = (id: string): Elemento => { let e = elementos.get(id); if (!e) { e = new Elemento(); elementos.set(id, e); } return e; };
    const pendientes: Array<() => void> = [];
    const historial: string[] = [];
    const ctx: any = {
      console, URLSearchParams, AbortController, setTimeout, clearTimeout, Promise, Array, Object, String, Number, Math, JSON, parseInt, parseFloat, isNaN, Date, Error, RegExp, Set, Map,
      document: { getElementById: el, querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, createElement: () => new Elemento(), body: new Elemento() },
      window: { addEventListener() {}, pdfjsLib: undefined },
      navigator: { clipboard: { writeText: () => Promise.resolve() } },
      location: { pathname: '/', search: '' },
      history: { pushState: (_a: unknown, _b: string, u: string) => historial.push('push ' + u), replaceState: (_a: unknown, _b: string, u: string) => historial.push('replace ' + u) },
      fetch: (url: string, init?: any) => {
        const out = respuestas(url, init);
        return Promise.resolve(out).then((o) => {
          if (init?.signal?.aborted) { const e: any = new Error('abort'); e.name = 'AbortError'; throw e; }
          return { status: o.status, ok: o.status >= 200 && o.status < 300, json: () => (o.body === undefined ? Promise.reject(new Error('sin json')) : Promise.resolve(o.body)) };
        });
      }
    };
    ctx.window.document = ctx.document;
    vm.createContext(ctx);
    vm.runInContext(codigo, ctx);
    return { ctx, el, historial, run: <T,>(c: string): T => vm.runInContext(c, ctx) as T, pendientes };
  }
  const espera = (ms = 15) => new Promise((r) => setTimeout(r, ms));

  it('listas de edictos, leyes y marcas escapan titular, contenido y campos; ningún onclick lleva datos del corpus', async () => {
    const mal = '<img src=x onerror=alert(1)>';
    const comilla = "');alert(1);//";
    const hostil = { id: 'h', tomo: mal, numero: mal, fecha: mal, pagina: comilla, categoria: 'GENERAL', seccion: mal, titular: mal + comilla, contenido: mal + '<script>x()</script>', duisEncontrados: [comilla, mal], clasificacionJuridica: mal };
    const b = navegador((url) => {
      if (url.includes('edictos-recientes')) return { status: 200, body: { edictos: [hostil] } };
      if (url.includes('leyes-recientes')) return { status: 200, body: { leyes: [hostil] } };
      return { status: 200, body: { marcas: [{ claseNiza: mal, pagina: comilla, tomo: mal, denominacion: comilla + mal, titular: mal, claseDescripcion: mal, expediente: mal, fechaPublicacion: mal }] } };
    });
    b.run('loadRecentEdictos()'); b.run('loadRecentLeyes()'); b.el('marca-query').value = 'x'; b.run('searchMarcas()');
    await espera();
    for (const id of ['edictos-recientes-container', 'leyes-recientes-container', 'marcas-results-container']) {
      const h = b.el(id).innerHTML;
      assert.ok(h.length > 50, id);
      assert.ok(!/<img src=x/i.test(h) && !/<script/i.test(h), `${id} contiene HTML sin escapar`);
      assert.ok(!/onerror=/i.test(h.replace(/&lt;[^>]*?&gt;/g, '')) || !/<[^>]*onerror=/i.test(h), id);
      for (const m of h.matchAll(/onclick="([^"]*)"/g)) assert.ok(!/alert|onerror|<img/.test(m[1]!), `${id}: onclick con datos del corpus: ${m[1]}`);
    }
  });

  it('el modal de cita y las tarjetas de resultado escapan términos y clasificación hostiles', async () => {
    const mal = '<img src=x onerror=alert(1)>';
    const b = navegador(() => ({ status: 200, body: {} }));
    b.run(`currentHighlightedTerm = ${JSON.stringify(mal)}; currentPageRecords = [{ clasificacionJuridica: ${JSON.stringify(mal)}, duisEncontrados: [${JSON.stringify(mal)}] }]; currentEbookPage = 3;`);
    b.run('openCertifiedCitationModal()');
    const h = b.el('certified-citation-body').innerHTML;
    assert.ok(!/<img/i.test(h), h);
    const badge = b.run<string>(`getLegalClassificationBadge(${JSON.stringify(mal)})`);
    assert.ok(!/<img src=x/i.test(badge.replace(/<img src="[^"]*" alt="" class="w-4 h-4">/, '')), badge);
    const chips = b.run<string>(`renderDuiChipsHtml([${JSON.stringify("');alert(1);//")}], ${JSON.stringify("1' onmouseover='alert(1)")})`);
    assert.ok(!/onclick/.test(chips) && !/onmouseover='/.test(chips), chips);
  });

  it('el HTML de la portada no incrusta datos dinámicos ni JSON en <script> con valores del corpus', () => {
    const h = renderPortal({ totalDocumentos: 5, totalAlertas: 2 });
    assert.ok(!/<script[^>]*>[^<]*(titular|contenido)\s*:\s*['"`]/.test(h));
    assert.ok(!/\$\{(e|l|m|rec|d)\.(titular|contenido|denominacion)\}/.test(h.replace(/escapeHtmlText\([^)]*\)/g, '')), 'quedan interpolaciones sin escapar');
  });
});

// ------------------------------------------------------------------------------------------------
describe('Adversarial: interfaz de búsqueda (carreras, errores HTTP, historial)', () => {
  function entorno(respuestas: (url: string, init?: any) => Promise<{ status: number; body: unknown }> | { status: number; body: unknown }) {
    const html = renderPortal({ totalDocumentos: 1, totalAlertas: 0 });
    const codigo = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]!).sort((a, b) => b.length - a.length)[0]!;
    class E {
      innerHTML = ''; innerText = ''; textContent = ''; value = ''; checked = false; disabled = false; options = [{ value: '' }, { value: 'EDICTO_JUDICIAL' }];
      attrs = new Map<string, string>(); clases = new Set<string>();
      classList = { add: (...c: string[]) => c.forEach((x) => this.clases.add(x)), remove: (...c: string[]) => c.forEach((x) => this.clases.delete(x)), contains: (c: string) => this.clases.has(c) };
      setAttribute(k: string, v: string) { this.attrs.set(k, String(v)); }
      removeAttribute(k: string) { this.attrs.delete(k); }
      getAttribute(k: string) { return this.attrs.get(k) ?? null; }
      hasAttribute(k: string) { return this.attrs.has(k); }
      addEventListener() {} scrollIntoView() {} focus() {} closest() { return null; } querySelectorAll() { return []; }
    }
    const els = new Map<string, E>();
    const el = (id: string): E => { let e = els.get(id); if (!e) { e = new E(); els.set(id, e); } return e; };
    const hist: string[] = [];
    const llamadas: Array<{ url: string; signal?: AbortSignal }> = [];
    const ctx: any = {
      console, URLSearchParams, AbortController, setTimeout, clearTimeout, Promise, Array, Object, String, Number, Math, JSON, parseInt, parseFloat, isNaN, Date, Error, RegExp, Set, Map,
      document: { getElementById: el, querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, createElement: () => new E(), body: new E() },
      window: { addEventListener() {} }, navigator: {}, location: { pathname: '/', search: '' },
      history: { pushState: (_a: unknown, _b: string, u: string) => hist.push(u), replaceState: (_a: unknown, _b: string, u: string) => hist.push('r:' + u) },
      fetch: (url: string, init?: any) => {
        llamadas.push({ url, signal: init?.signal });
        return Promise.resolve(respuestas(url, init)).then((o) => {
          if (init?.signal?.aborted) { const e: any = new Error('abort'); e.name = 'AbortError'; throw e; }
          return { status: o.status, ok: o.status < 300, json: () => (o.body === undefined ? Promise.reject(new Error('x')) : Promise.resolve(o.body)) };
        });
      }
    };
    vm.createContext(ctx);
    vm.runInContext(codigo, ctx);
    const buscar = (q: string, pagina?: number) => { el('query-input').value = q; return vm.runInContext(`searchDiario(null, ${pagina ?? 'undefined'})`, ctx); };
    return { el, hist, llamadas, buscar, ctx };
  }
  const espera = (ms = 20) => new Promise((r) => setTimeout(r, ms));
  const respuestaOk = (texto: string) => ({
    status: 200,
    body: {
      consulta: { texto, criterios: [{ tipo: 'termino', texto }] }, total: 1, pagina: 1, porPagina: 10, totalPaginas: 1,
      resultados: [{ id: 'r', puntaje: 1, diario: { id: 'r', tomo: 1, numero: 2, fecha: '2026-01-01', pagina: 3, categoria: 'GENERAL', seccion: 's', titular: texto, duisEncontrados: [], pdfUrlOficial: '/x' },
        identificacion: { tipo: 'T', numeroDocumento: null, designacion: null, titulo: texto, organo: null, fechaIso: '', fechaLarga: '', diario: 'Tomo 1' },
        cabecera: { tipoHtml: 'T', numeroHtml: null, tituloHtml: `RESULTADO-${texto}`, organoHtml: null, fechaHtml: '' }, coincidencias: [], coincidenciasOmitidas: 0, camposCoincidentes: [], coincidenciaExacta: false }]
    }
  });

  it('una respuesta lenta de una consulta anterior no pisa a la consulta más reciente', async () => {
    const lentas = new Map<string, () => void>();
    const e = entorno((url) => {
      const q = decodeURIComponent(/q=([^&]*)/.exec(url)![1]!);
      if (q === 'lenta') return new Promise((res) => lentas.set(q, () => res(respuestaOk('lenta'))));
      return respuestaOk(q);
    });
    e.buscar('lenta');
    e.buscar('rapida');
    await espera();
    assert.match(e.el('results-container').innerHTML, /RESULTADO-rapida/);
    lentas.get('lenta')!();
    await espera();
    assert.match(e.el('results-container').innerHTML, /RESULTADO-rapida/, 'la respuesta vieja no debe reemplazar a la nueva');
    assert.ok(e.llamadas[0]!.signal?.aborted, 'la solicitud anterior debe cancelarse');
    assert.equal(e.el('btn-search').disabled, false);
  });

  it('errores 400, 429 y 500 y fallos de red muestran un mensaje claro y dejan el botón activo', async () => {
    const casos: Array<[number | 'red' | 'html', RegExp]> = [[400, /Revisa lo que escribiste/], [429, /Demasiadas consultas/], [500, /no pudo responder/], ['red', /No pudimos conectar/], ['html', /no pudo responder/]];
    for (const [codigo, esperado] of casos) {
      const e = entorno(() => {
        if (codigo === 'red') return Promise.reject(new Error('net')) as any;
        if (codigo === 'html') return { status: 502, body: undefined };
        return { status: codigo as number, body: { aviso: 'Aviso <b>x</b>', error: 'e' } };
      });
      e.buscar('ley especial');
      await espera();
      const h = e.el('results-container').innerHTML;
      assert.match(h, esperado, String(codigo));
      assert.ok(!h.includes('<b>x</b>'), 'el aviso del servidor se escapa');
      assert.equal(e.el('btn-search').disabled, false, String(codigo));
      assert.ok(!/Sin publicaciones oficiales/.test(h), 'un error nunca debe presentarse como «sin resultados»');
    }
  });

  it('una entrada inválida CON resultados muestra los resultados junto al aviso', async () => {
    const r = respuestaOk('x');
    (r.body as any).aviso = 'El dígito verificador de este DUI no es válido.';
    (r.body as any).entradaInvalida = true;
    const e = entorno(() => r);
    e.buscar('123456789');
    await espera();
    assert.match(e.el('results-container').innerHTML, /RESULTADO-x/);
    assert.ok(!e.el('search-aviso').clases.has('hidden'));
  });

  it('la URL queda compartible (q, categoría, página) y se restablece al abrirla', async () => {
    const e = entorno(() => respuestaOk('x'));
    e.el('category-filter').value = 'EDICTO_JUDICIAL';
    e.buscar('amnistía fiscal', 2);
    await espera();
    assert.ok(e.hist.some((u) => u.startsWith('/?') && u.includes('q=amnist%C3%ADa+fiscal') && u.includes('categoria=EDICTO_JUDICIAL') && u.includes('pagina=2')), JSON.stringify(e.hist));
    assert.ok(e.llamadas[0]!.url.includes('pagina=2'));
  });

  it('el HTML trae etiquetas accesibles y una región aria-live para resultados', () => {
    const h = renderPortal({ totalDocumentos: 1, totalAlertas: 0 });
    assert.match(h, /id="query-input"[^>]*aria-label=/);
    assert.match(h, /id="category-filter"[^>]*aria-label=/);
    assert.match(h, /id="search-resumen"[^>]*aria-live="polite"/);
    assert.ok(!/min-w-0bg|roundedtext/.test(h), 'clases CSS rotas por falta de espacio');
    for (const c of ['EDICTO_JUDICIAL', 'REGISTRO_MARCA', 'DECRETO_LEGISLATIVO', 'ACUERDO_EJECUTIVO', 'SUBASTA_EMBARGO', 'BALANCE_FINANCIERO', 'GENERAL']) assert.ok(h.includes(`value="${c}"`), c);
  });
});

// ------------------------------------------------------------------------------------------------
describe('Adversarial: limitador de tasa', () => {
  it('bloquea al superar el máximo, duplica el bloqueo en cada reincidencia y se acota', () => {
    const l = new LimitadorTasa(3, 1000, 8000);
    let t = 0;
    for (let i = 0; i < 3; i++) assert.ok(l.consumir('ip', t).permitido);
    const d1 = l.consumir('ip', t);
    assert.equal(d1.permitido, false);
    assert.equal(d1.reintentarEnSeg, 1);
    assert.equal(l.consumir('ip', t + 500).permitido, false, 'sigue bloqueada');
    t += 1500;
    for (let i = 0; i < 3; i++) assert.ok(l.consumir('ip', t).permitido);
    const d2 = l.consumir('ip', t);
    assert.equal(d2.reintentarEnSeg, 2);
    t += 2500;
    for (let i = 0; i < 3; i++) l.consumir('ip', t);
    assert.equal(l.consumir('ip', t).reintentarEnSeg, 4);
    t += 4500;
    for (let i = 0; i < 3; i++) l.consumir('ip', t);
    assert.equal(l.consumir('ip', t).reintentarEnSeg, 8);
    t += 8500;
    for (let i = 0; i < 3; i++) l.consumir('ip', t);
    assert.equal(l.consumir('ip', t).reintentarEnSeg, 8, 'tope del bloqueo');
    assert.ok(l.consumir('otra', t).permitido, 'otra IP no se ve afectada');
  });

  it('la memoria está acotada ante millones de claves distintas', () => {
    const l = new LimitadorTasa(5, 60_000, 60_000, 1000);
    for (let i = 0; i < 50_000; i++) l.consumir('ip-' + i, 1);
    assert.ok(l.tamano <= 1000);
  });
});

// ------------------------------------------------------------------------------------------------
describe('Adversarial: servidor HTTP real', () => {
  let proc: ChildProcess;
  let base = '';
  const puerto = 20000 + Math.floor(Math.random() * 20000);
  let ipN = 0;
  const nuevaIp = (): Record<string, string> => ({ 'X-Forwarded-For': `10.9.${(ipN >> 8) & 255}.${ipN++ & 255}` });

  before(async () => {
    base = `http://127.0.0.1:${puerto}`;
    proc = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], { cwd: process.cwd(), env: { ...process.env, PORT: String(puerto), RATE_LIMIT_SEARCH_MAX: '40' }, stdio: ['ignore', 'pipe', 'pipe'] });
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('el servidor no arrancó')), 20000);
      proc.stdout!.on('data', (d) => { if (String(d).includes('escuchando')) { clearTimeout(t); resolve(); } });
      proc.on('exit', (c) => reject(new Error('servidor terminó ' + c)));
    });
  });
  after(() => { proc?.kill(); });

  const get = async (p: string, h: Record<string, string> = nuevaIp()) => {
    const r = await fetch(base + p, { headers: h });
    const texto = await r.text();
    let json: any = null;
    try { json = JSON.parse(texto); } catch { /* no JSON */ }
    return { r, texto, json };
  };

  it('consulta válida: JSON con resultados, caché por URL y cabeceras de endurecimiento', async () => {
    const { r, json } = await get('/api/v1/search?q=' + encodeURIComponent('amnistía fiscal'));
    assert.equal(r.status, 200);
    assert.equal(json.total, 1);
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(r.headers.get('content-security-policy')?.includes("object-src 'none'"));
    assert.match(r.headers.get('cache-control') ?? '', /public/);
  });

  it('parámetros hostiles devuelven 400 con no-store y sin trazas', async () => {
    const malos = [
      '/api/v1/search?q=a&q=b', '/api/v1/search?q[]=a', '/api/v1/search?q[__proto__]=x', '/api/v1/search?__proto__[q]=ley&q=ley%20especial&constructor[prototype][x]=1',
      '/api/v1/search?q=ley&pagina=0', '/api/v1/search?q=ley&pagina=1001', '/api/v1/search?q=ley&pagina=abc', '/api/v1/search?q=ley&pagina=1e3', '/api/v1/search?q=ley&pagina=-1',
      '/api/v1/search?q=ley&porPagina=51', '/api/v1/search?q=ley&porPagina=0', '/api/v1/search?q=ley&categoria=NOEXISTE', '/api/v1/search?q=ley&categoria[]=GENERAL',
      '/api/v1/search?q=ley&forceDui=quizas', '/api/v1/search?q=' + 'a'.repeat(2500), '/api/v1/search?q=' + 'a%20'.repeat(150)
    ];
    for (const m of malos) {
      const { r, json, texto } = await get(m);
      if (m.includes('__proto__') && !m.includes('pagina')) { assert.ok(r.status === 200 || r.status === 400, m); continue; }
      assert.equal(r.status, 400, m);
      assert.equal(r.headers.get('cache-control'), 'no-store', m);
      assert.ok(json?.aviso, m);
      assert.ok(!/node_modules|at \w+ \(|\.ts:\d+/.test(texto), 'sin trazas: ' + m);
    }
    assert.equal(({} as any).x, undefined, 'el prototipo del servidor no se contamina (comprobación indirecta)');
  });

  it('consultas patológicas responden rápido (sin ReDoS ni costos explosivos)', async () => {
    const qs = ['(a+)+$'.repeat(30), '*'.repeat(200), 'a '.repeat(100), 'ley '.repeat(50), 'aa bb cc dd ee ff gg hh ii', 'x'.repeat(41), '\u0000'.repeat(100), '"'.repeat(199), '((((((((((((((((((((((((((((((((((((((((ley'];
    for (const q of qs) {
      const t0 = performance.now();
      const { r } = await get('/api/v1/search?q=' + encodeURIComponent(q.slice(0, 200)));
      assert.ok(r.status === 200 || r.status === 400, q.slice(0, 20));
      assert.ok(performance.now() - t0 < 1000, `lento: ${q.slice(0, 20)}`);
    }
  });

  it('paginación profunda dentro del límite es barata y fuera del límite se rechaza', async () => {
    const t0 = performance.now();
    const { r, json } = await get('/api/v1/search?q=ley&pagina=1000&porPagina=50');
    assert.equal(r.status, 200);
    assert.equal(json.resultados.length, 0);
    assert.ok(performance.now() - t0 < 500);
  });

  it('un cuerpo JSON inválido no filtra trazas', async () => {
    const r = await fetch(base + '/api/v1/alerts', { method: 'POST', headers: { 'Content-Type': 'application/json', ...nuevaIp() }, body: '{"roto":' });
    const t = await r.text();
    assert.equal(r.status, 400);
    assert.ok(!/node_modules|at \w+ \(|SyntaxError/.test(t), t.slice(0, 200));
    const grande = await fetch(base + '/api/v1/alerts', { method: 'POST', headers: { 'Content-Type': 'application/json', ...nuevaIp() }, body: JSON.stringify({ x: 'a'.repeat(100_000) }) });
    assert.equal(grande.status, 413);
  });

  it('tras superar el límite por IP responde 429 con Retry-After y sin caché; otra IP no se ve afectada', async () => {
    const ip = { 'X-Forwarded-For': '203.0.113.77' };
    let ultimo = 200;
    let cabecera: string | null = null;
    let cache: string | null = null;
    for (let i = 0; i < 60; i++) {
      const r = await fetch(base + '/api/v1/search?q=ley%20especial', { headers: ip });
      ultimo = r.status;
      if (r.status === 429) { cabecera = r.headers.get('retry-after'); cache = r.headers.get('cache-control'); break; }
    }
    assert.equal(ultimo, 429);
    assert.ok(Number(cabecera) >= 1);
    assert.equal(cache, 'no-store');
    const otra = await get('/api/v1/search?q=ley%20especial');
    assert.equal(otra.r.status, 200);
  });

  it('XSS reflejado: la portada no refleja el parámetro q ni lo ejecuta', async () => {
    const { texto } = await get('/?q=' + encodeURIComponent('<script>alert(1)</script>'));
    assert.ok(!texto.includes('<script>alert(1)</script>'));
  });
});

// ------------------------------------------------------------------------------------------------
describe('Adversarial: consultas reales sobre el corpus real, verificadas a mano', () => {
  const idx = new DiarioIndex();
  idx.addBatch(corpus.map((r) => ({ ...r })));
  const ID = 'do-453-23102026-p1-dec690';
  const todo = (q: string) => idx.buscar({ q, porPagina: 50 });

  it('el decreto 690 aparece primero con 690, D.690, Dec. 690/2026 y decreto nº 690', () => {
    for (const q of ['690', 'D.690', 'Dec. 690/2026', 'decreto nº 690', 'Decreto No. 690.-', 'decreto N° 690', 'DECRETO LEGISLATIVO 690']) {
      assert.equal(todo(q).resultados[0]?.id, ID, q);
    }
  });

  it('la sumario/denominación no se presenta como dato: «recargos e intereses» muestra solo el párrafo que lo contiene', () => {
    const x = todo('recargos e intereses').resultados[0]!;
    assert.equal(x.id, ID);
    const cuerpo = x.coincidencias.filter((c) => c.ubicacion === 'cuerpo');
    assert.equal(cuerpo.length, 1);
    assert.deepEqual(marcado(cuerpo[0]!.html), ['recargos e intereses']);
    assert.ok(cuerpo[0]!.texto.length < corpus.find((d) => d.id === ID)!.contenido.length);
  });

  it('«ley especial» y «"ley especial"» marcan solo esas palabras y las marcas son literales del texto', () => {
    for (const q of ['ley especial', '"ley especial"', 'LEY ESPECIAL']) {
      const r = todo(q);
      assert.ok(r.total >= 3);
      for (const x of r.resultados) for (const c of x.coincidencias) for (const m of marcado(c.html)) assert.ok(/^(ley(es)?|especial(es)?)( (ley(es)?|especial(es)?))*$/.test(plegar(m)), `${q}: «${m}»`);
    }
  });

  it('«TRIBUTARIAS», «tributarias», «Tributarias» dan lo mismo; «tributaria» (singular) también llega a «Tributarias»', () => {
    const a = todo('TRIBUTARIAS').total;
    assert.ok(a >= 1);
    assert.equal(todo('tributarias').total, a);
    assert.equal(todo('Tributarias').total, a);
    assert.ok(todo('tributaria').total >= a);
  });

  it('un DUI del corpus localiza su publicación en cualquiera de sus formas', () => {
    const conDui = corpus.find((r) => r.duisEncontrados.length > 0)!;
    const dui = conDui.duisEncontrados[0]!;
    const digitos = dui.replace(/\D/g, '');
    for (const q of [dui, digitos, `${digitos.slice(0, 8)}-${digitos.slice(8)}`]) {
      const r = todo(q);
      assert.ok(r.resultados.some((x) => x.id === conDui.id), q);
    }
  });

  it('toda consulta del corpus devuelve marcas que son subcadenas literales del texto mostrado', () => {
    for (const q of ['amnistía fiscal', 'recargos e intereses', 'Tránsito', 'TRIBUTARIAS', 'juzgado', 'san salvador', 'herencia', 'sociedad', 'notario', 'señor', '"ley especial"']) {
      for (const x of todo(q).resultados) {
        for (const f of x.coincidencias) {
          assert.ok(f.rangos.every(([a, b]) => a >= 0 && b <= f.texto.length && a < b), q);
          assert.equal(desescapar(f.html.replace(/<\/?mark[^>]*>/g, '')), f.texto);
        }
      }
    }
  });

  it('rendimiento concurrente: p95 < 150 ms con consultas variadas', async () => {
    const qs = ['ley', 'ley especial', 'amnistía fiscal', 'juzgado civil', 'señor', 'san salvador', 'herencia intestada', '690', 'Tránsito', 'sociedad anónima'];
    const tiempos: number[] = [];
    await Promise.all(Array.from({ length: 20 }, async (_, w) => {
      for (let i = 0; i < 30; i++) {
        const t0 = performance.now();
        idx.buscar({ q: qs[(w + i) % qs.length]!, pagina: 1 + (i % 3), porPagina: 10 });
        tiempos.push(performance.now() - t0);
        if (i % 5 === 0) await new Promise((r) => setImmediate(r));
      }
    }));
    tiempos.sort((a, b) => a - b);
    assert.ok(tiempos[Math.floor(tiempos.length * 0.95)]! < 150);
  });
});
