// Búsqueda por campo y párrafo: caso Decreto 690, tildes, frases, XSS, límites, paginación, ranking y rendimiento.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import type { DiarioRecord } from '../src/types.js';
import { DiarioIndex } from '../src/indexer.js';
import { nucleo, RESALTADO_CLIENT_JS } from '../src/resaltado.js';
import { BUSQUEDA_CLIENT_JS } from '../src/busqueda_vista.js';
import { segmentarRegistro } from '../src/segmentos.js';
import { validarParametrosBusqueda } from '../src/busqueda_esquema.js';
import { renderPortal } from '../src/views.js';
import { cargarCatalogo } from '../src/diarios.js';

const corpus: DiarioRecord[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'data_diario_real.json'), 'utf8'));

const rec = (over: Partial<DiarioRecord>): DiarioRecord => ({
  id: 'x-1', tomo: 453, numero: 198, fecha: '2026-10-23', pagina: 50, categoria: 'EDICTO_JUDICIAL', seccion: 'Sección de prueba',
  titular: 'Titular de prueba', contenido: 'contenido de prueba', duisEncontrados: [], nitsEncontrados: [], nombresClave: [],
  pdfUrlOficial: '/pdf/23-10-2026.pdf#page=50', ...over
});

/** Texto visible de un fragmento marcado (lo que realmente queda dentro de <mark>). */
const marcado = (html: string): string[] => [...html.matchAll(/<mark[^>]*>([\s\S]*?)<\/mark>/g)].map((m) => m[1]!);

describe('Acuerdo No. 755 (corpus real): la coincidencia se muestra en su campo y párrafo, no como resumen', () => {
  const idx = new DiarioIndex();
  idx.addBatch(corpus.map((r) => ({ ...r })));
  // Acuerdo del Ramo de Economía publicado en la pág. 26 del PDF: se localiza por su titular, nunca por un id escrito a mano.
  const dec = corpus.find((r) => /^Acuerdo No\. 755 —/.test(r.titular))!;
  const ID = dec.id;

  it('el acuerdo existe en el corpus real', () => {
    assert.ok(dec, 'Acuerdo No. 755 debe estar en data_diario_real.json');
  });

  it('«SANCHIA INTERNATIONAL» resalta en párrafos concretos y no devuelve el texto completo como dato', () => {
    const r = idx.buscar({ q: 'SANCHIA INTERNATIONAL' });
    const x = r.resultados.find((y) => y.id === ID)!;
    assert.ok(x);
    const frs = x.coincidencias.filter((f) => f.ubicacion === 'cuerpo');
    assert.ok(frs.length >= 1);
    for (const f of frs) {
      assert.ok(marcado(f.html).length >= 1);
      assert.ok(marcado(f.html).every((m) => /^(sanchia|international)( international)?$/i.test(m.replace(/\s+/g, ' '))), JSON.stringify(marcado(f.html)));
      assert.notEqual(f.texto, dec.contenido);
      assert.ok(f.texto.length <= 900);
      assert.match(f.etiqueta, /^(Párrafo|Considerando|Artículo|Por tanto|Parte dispositiva)/);
    }
    assert.ok(x.coincidencias.every((c) => c.campo !== 'sumario'));
  });

  it('«incisos arancelarios» entre comillas marca la frase completa en el mismo párrafo', () => {
    const x = idx.buscar({ q: '"incisos arancelarios"' }).resultados.find((y) => y.id === ID)!;
    const f = x.coincidencias.find((c) => c.ubicacion === 'cuerpo')!;
    assert.ok(marcado(f.html).length >= 1);
    assert.ok(marcado(f.html).every((m) => m.toLowerCase() === 'incisos arancelarios'));
  });

  it('«755» coincide con el número del documento (cabecera), con el máximo puntaje', () => {
    const r = idx.buscar({ q: '755' });
    const x = r.resultados[0]!;
    assert.equal(x.id, ID);
    assert.equal(x.identificacion.numeroDocumento, '755');
    assert.deepEqual(marcado(x.cabecera.numeroHtml!), ['755']);
    assert.ok(x.coincidencias.some((c) => c.campo === 'numero'));
    assert.ok(x.puntaje > (r.resultados[1]?.puntaje ?? 0));
  });

  it('«ECONOMÍA» (mayúsculas y tilde) marca «Economia» del título sin importar tildes ni mayúsculas', () => {
    for (const q of ['ECONOMÍA', 'economia', 'Economía']) {
      const x = idx.buscar({ q }).resultados.find((y) => y.id === ID)!;
      assert.ok(x, q);
      assert.deepEqual(marcado(x.cabecera.tituloHtml), ['Economia'], q);
    }
  });

  it('el acuerdo se identifica con tipo, número, órgano, fecha y diario', () => {
    const x = idx.buscar({ q: '755' }).resultados[0]!;
    assert.equal(x.identificacion.tipo, 'Acuerdo');
    assert.equal(x.identificacion.designacion, 'Acuerdo No. 755');
    assert.equal(x.identificacion.organo, 'Órgano Ejecutivo');
    assert.equal(x.identificacion.fechaIso, '2026-10-23');
    assert.equal(x.identificacion.fechaLarga, '23 de octubre de 2026');
    assert.match(x.identificacion.diario, /Tomo 453 · N\.° 198 · Pág\. 26/);
  });

  it('distintos formatos de número de acuerdo llevan al mismo documento', () => {
    for (const q of ['Acuerdo No. 755', 'acuerdo 755', 'D. 755', 'd755', 'ACUERDO NO 755', 'Acuerdo Ejecutivo N° 755']) {
      const r = idx.buscar({ q });
      assert.equal(r.resultados[0]?.id, ID, q);
      assert.deepEqual(marcado(r.resultados[0]!.cabecera.numeroHtml!), ['Acuerdo No. 755'], q);
    }
    assert.ok(!idx.buscar({ q: 'Acuerdo 7559' }).resultados.some((x) => x.id === ID));
  });
});

describe('Plegado, tildes y mapeo de posiciones', () => {
  it('ignora tildes, ñ y mayúsculas en ambos sentidos', () => {
    const idx = new DiarioIndex();
    idx.addRecord(rec({ id: 'a-1', titular: 'Edicto', contenido: 'Sucesión de PEDRO MUÑOZ NÚÑEZ, vecino de Ahuachapán.' }));
    for (const q of ['munoz', 'MUÑOZ', 'Muñóz', 'nunez', 'ahuachapan', 'sucesion']) {
      const r = idx.buscar({ q });
      assert.equal(r.total, 1, q);
    }
    const f = idx.buscar({ q: 'munoz nunez' }).resultados[0]!.coincidencias.find((c) => c.ubicacion === 'cuerpo')!;
    assert.deepEqual(marcado(f.html), ['MUÑOZ NÚÑEZ']);
  });

  it('el mapa de posiciones es correcto con texto descompuesto (NFD) y espacios múltiples', () => {
    const texto = 'José  Muñoz   vive aqui';
    const seg = nucleo.preparar(texto);
    const an = nucleo.analizar('jose munoz');
    assert.ok(an.ok);
    if (!an.ok) return;
    const rangos = nucleo.unirRangos(nucleo.localizar(seg, an.criterios).map((h): [number, number] => [h.a, h.b]), texto);
    assert.equal(rangos.length, 1);
    assert.equal(texto.slice(rangos[0]![0], rangos[0]![1]), 'José  Muñoz');
  });

  it('el plegado conserva la longitud del mapa aunque cambie la del texto', () => {
    const f = nucleo.plegar('ÁÉÍ  ß ­ x​');
    assert.equal(f.ini.length, f.plano.length);
    assert.equal(f.fin.length, f.plano.length);
  });
});

describe('Frases, términos múltiples y ranking', () => {
  const idx = new DiarioIndex();
  idx.addRecord(rec({ id: 'r-cuerpo', titular: 'Aviso general', contenido: 'La empresa menciona un convenio de pago de multas al final del texto.' }));
  idx.addRecord(rec({ id: 'r-titulo', titular: 'Convenio de pago de obligaciones', contenido: 'Texto sin relación.' }));
  idx.addRecord(rec({ id: 'r-suelto', titular: 'Otro aviso', contenido: 'El pago se hizo. Aparte se firmó el convenio posterior.' }));

  it('la frase entre comillas exige palabras contiguas y en orden', () => {
    const r = idx.buscar({ q: '"convenio de pago"' });
    assert.deepEqual(r.resultados.map((x) => x.id).sort(), ['r-cuerpo', 'r-titulo']);
    assert.ok(!r.resultados.some((x) => x.id === 'r-suelto'));
  });

  it('sin comillas, las palabras sueltas pueden estar separadas', () => {
    const r = idx.buscar({ q: 'convenio pago' });
    assert.ok(r.resultados.some((x) => x.id === 'r-suelto'));
  });

  it('coincidencia en el título pesa más que en el cuerpo, y la frase junta más que términos separados', () => {
    const r = idx.buscar({ q: 'convenio pago' });
    const ids = r.resultados.map((x) => x.id);
    assert.equal(ids[0], 'r-titulo');
    assert.ok(ids.indexOf('r-cuerpo') < ids.indexOf('r-suelto'));
  });

  it('el número de decreto pesa más que la misma cifra en el cuerpo', () => {
    const i2 = new DiarioIndex();
    i2.addRecord(rec({ id: 'n-1', titular: 'Aviso', contenido: 'Ver página 777 y el artículo 777 del reglamento.' }));
    i2.addRecord(rec({ id: 'n-2', categoria: 'DECRETO_LEGISLATIVO', titular: 'Decreto No. 777 · Ley de prueba', contenido: 'ORGANO LEGISLATIVO. Decreto No. 777.- Ley de prueba. Texto.' }));
    assert.equal(i2.buscar({ q: '777' }).resultados[0]!.id, 'n-2');
  });
});

describe('Segmentación por campo y párrafo', () => {
  it('etiqueta artículos y considerandos con su número', () => {
    const d = segmentarRegistro(rec({
      categoria: 'DECRETO_LEGISLATIVO',
      titular: 'Decreto No. 12 · Ley de ejemplo',
      contenido: 'ORGANO LEGISLATIVO. Decreto No. 12.- Ley de ejemplo.\n\nCONSIDERANDO:\n\nI.- Que la Constitución establece principios.\n\nII.- Que es necesario regular.\n\nPOR TANTO,\n\nDECRETA:\n\nArt. 1.- Objeto de la ley.\n\nArt. 2.- Definiciones aplicables.'
    }));
    const etiquetas = d.segmentos.filter((s) => !s.cabecera).map((s) => s.etiqueta);
    assert.ok(etiquetas.includes('Considerando I'));
    assert.ok(etiquetas.includes('Considerando II'));
    assert.ok(etiquetas.includes('Artículo 1'));
    assert.ok(etiquetas.includes('Artículo 2'));
    assert.ok(etiquetas.includes('Por tanto'));
    assert.equal(d.identificacion.numeroDocumento, '12');
  });

  it('el sumario solo aparece como dato cuando es lo que coincide', () => {
    const idx = new DiarioIndex();
    idx.addRecord(rec({ id: 's-1', titular: 'Decreto No. 5 · Norma', contenido: 'ORGANO LEGISLATIVO. Decreto No. 5.- Norma. Disposición única sobre pesca artesanal.', sumario: 'Resumen sobre cooperativas agrícolas del oriente.' }));
    const pesca = idx.buscar({ q: 'pesca' }).resultados[0]!;
    assert.ok(pesca.coincidencias.every((c) => c.campo !== 'sumario'));
    const coop = idx.buscar({ q: 'cooperativas' }).resultados[0]!;
    const f = coop.coincidencias.find((c) => c.campo === 'sumario')!;
    assert.equal(f.etiqueta, 'Sumario');
    assert.deepEqual(marcado(f.html), ['cooperativas']);
  });

  it('un párrafo largo se parte en trozos de oraciones completas y la ventana se centra en la coincidencia', () => {
    const largo = Array.from({ length: 60 }, (_, i) => `Oración número ${i} del párrafo extenso.`).join(' ') + ' Aquí aparece la palabra zarzaparrilla central. ' +
      Array.from({ length: 60 }, (_, i) => `Cierre ${i} del texto.`).join(' ');
    const idx = new DiarioIndex();
    idx.addRecord(rec({ id: 'l-1', contenido: largo }));
    const f = idx.buscar({ q: 'zarzaparrilla' }).resultados[0]!.coincidencias.find((c) => c.ubicacion === 'cuerpo')!;
    assert.ok(f.texto.length <= 900);
    assert.deepEqual(marcado(f.html), ['zarzaparrilla']);
    assert.match(f.etiqueta, /^Párrafo 1 \(parte \d+ de \d+\)$/);
  });
});

describe('Seguridad: XSS y entradas hostiles', () => {
  it('los datos con <script> se escapan antes de insertar <mark>', () => {
    const idx = new DiarioIndex();
    idx.addRecord(rec({ id: 'x-1', titular: '<img src=x onerror=alert(1)> Titular', contenido: 'Texto <script>alert(1)</script> & "comillas" con alert dentro.' }));
    const x = idx.buscar({ q: 'alert' }).resultados[0]!;
    const todo = JSON.stringify([x.cabecera, x.coincidencias.map((c) => c.html)]);
    assert.ok(!/<script/i.test(todo));
    assert.ok(!/<img/i.test(todo));
    const f = x.coincidencias.find((c) => c.ubicacion === 'cuerpo')!;
    assert.ok(f.html.includes('&lt;script&gt;'));
    assert.ok(f.html.includes('&amp;'));
    assert.ok(f.html.includes('&quot;comillas&quot;'));
    assert.ok(marcado(f.html).every((m) => /^alert$/i.test(m)));
  });

  it('una consulta con etiquetas se rechaza sin ejecutar búsqueda', () => {
    const idx = new DiarioIndex();
    idx.addRecord(rec({ contenido: '<script>alert(1)</script>' }));
    for (const q of ['<script>alert(1)</script>', '"><img src=x onerror=alert(1)>', "'; DROP TABLE x;--<"]) {
      const r = idx.buscar({ q });
      assert.equal(r.entradaInvalida, true, q);
      assert.equal(r.total, 0);
    }
  });

  it('el resaltador escapa aunque el rango caiga sobre caracteres especiales', () => {
    const html = nucleo.resaltarHtml('a<b>&c', [[1, 4]], 'gs-mark');
    assert.equal(html, 'a<mark class="gs-mark">&lt;b&gt;</mark>&amp;c');
    assert.equal(nucleo.resaltarHtml('x', [[0, 1]], '"><script>'), '<mark class="&quot;&gt;&lt;script&gt;">x</mark>');
  });

  it('el atributo clicable de la interfaz histórica no admite comillas ni barras', () => {
    const idx = new DiarioIndex();
    idx.addRecord(rec({ contenido: 'Texto con alerta importante.' }));
    const r = idx.search("alerta') onmouseover=alert(1) x='");
    for (const x of r.results) assert.ok(!/onclick="[^"]*'\)[^"]*onmouseover/.test(x.snippet));
  });

  it('metacaracteres de expresión regular y patrones catastróficos no rompen ni se ejecutan', () => {
    const idx = new DiarioIndex();
    idx.addBatch(corpus.map((r) => ({ ...r })));
    const hostiles = ['.*+?^${}()|[]\\', '(a+)+$ aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!', '(.*)*x', '[a-z]+@+', 'a'.repeat(39), '"' + 'a '.repeat(30) + '"'];
    for (const q of hostiles) {
      const t = performance.now();
      assert.doesNotThrow(() => idx.buscar({ q }), q);
      assert.ok(performance.now() - t < 150, `lento: ${q}`);
    }
  });
});

describe('Límites y validación estricta', () => {
  const idx = new DiarioIndex();
  idx.addBatch(corpus.map((r) => ({ ...r })));

  it('consulta vacía, de espacios o muy corta: entrada inválida con aviso', () => {
    for (const q of ['', '    ', 'a', 'ab']) {
      const r = idx.buscar({ q });
      assert.equal(r.entradaInvalida, true, JSON.stringify(q));
      assert.ok(r.aviso);
      assert.equal(r.total, 0);
    }
  });

  it('consulta enorme, demasiados términos y palabras kilométricas se rechazan con mensaje claro', () => {
    assert.equal(idx.buscar({ q: 'a'.repeat(100000) }).entradaInvalida, true);
    assert.equal(idx.buscar({ q: 'x'.repeat(201) }).entradaInvalida, true);
    assert.match(idx.buscar({ q: 'uno dos tres cuatro cinco seis siete ocho nueve' }).aviso ?? '', /DUI|demasiad/i);
    const muchos = idx.buscar({ q: 'alfa beta gamma delta epsilon zeta eta theta iota' });
    assert.equal(muchos.entradaInvalida, true);
    assert.match(muchos.aviso!, /8/);
    assert.match(idx.buscar({ q: 'palabra ' + 'z'.repeat(41) }).aviso ?? '', /demasiado larga/);
    const dieciocho = idx.buscar({ q: Array.from({ length: 17 }, (_, i) => `t${i}`).join(' ') });
    assert.match(dieciocho.aviso ?? '', /demasiadas palabras/);
  });

  it('solo palabras vacías ("de la") no es una consulta útil', () => {
    const r = idx.buscar({ q: 'de la' });
    assert.equal(r.entradaInvalida, true);
  });

  it('el esquema HTTP rechaza tipos, rangos y categorías inválidos', () => {
    assert.equal(validarParametrosBusqueda({ q: ['a', 'b'] }).ok, false);
    assert.equal(validarParametrosBusqueda({ q: { a: 1 } }).ok, false);
    assert.equal(validarParametrosBusqueda({ q: 'x'.repeat(201) }).ok, false);
    assert.equal(validarParametrosBusqueda({ q: 'x'.repeat(100000) }).ok, false);
    assert.equal(validarParametrosBusqueda({ q: 'hola', pagina: '0' }).ok, false);
    assert.equal(validarParametrosBusqueda({ q: 'hola', pagina: 'abc' }).ok, false);
    assert.equal(validarParametrosBusqueda({ q: 'hola', pagina: '1001' }).ok, false);
    assert.equal(validarParametrosBusqueda({ q: 'hola', porPagina: '51' }).ok, false);
    assert.equal(validarParametrosBusqueda({ q: 'hola', porPagina: '-1' }).ok, false);
    assert.equal(validarParametrosBusqueda({ q: 'hola', categoria: 'DROP' }).ok, false);
    assert.equal(validarParametrosBusqueda({ q: 'hola', forceDui: 'si' }).ok, false);
    const ok = validarParametrosBusqueda({ q: 'hola', categoria: 'EDICTO_JUDICIAL', forceDui: '1', pagina: '2', porPagina: '20' });
    assert.ok(ok.ok);
    if (ok.ok) assert.deepEqual(ok.valor, { q: 'hola', categoria: 'EDICTO_JUDICIAL', soloDui: true, pagina: 2, porPagina: 20 });
    const vacio = validarParametrosBusqueda({});
    assert.ok(vacio.ok);
    if (vacio.ok) assert.deepEqual([vacio.valor.pagina, vacio.valor.porPagina, vacio.valor.q], [1, 10, '']);
  });

  it('el filtro de sección se respeta', () => {
    const r = idx.buscar({ q: 'decreto', categoria: 'EDICTO_JUDICIAL' });
    assert.ok(r.resultados.every((x) => x.diario.categoria === 'EDICTO_JUDICIAL'));
  });
});

describe('Paginación', () => {
  const idx = new DiarioIndex();
  for (let i = 0; i < 25; i++) idx.addRecord(rec({ id: `p-${String(i).padStart(2, '0')}`, pagina: i + 1, contenido: `Edicto número ${i} sobre la palabra paginable.` }));

  it('reparte los resultados sin repetir ni omitir, con totales correctos', () => {
    const p1 = idx.buscar({ q: 'paginable', pagina: 1, porPagina: 10 });
    const p2 = idx.buscar({ q: 'paginable', pagina: 2, porPagina: 10 });
    const p3 = idx.buscar({ q: 'paginable', pagina: 3, porPagina: 10 });
    assert.deepEqual([p1.resultados.length, p2.resultados.length, p3.resultados.length], [10, 10, 5]);
    assert.deepEqual([p1.total, p1.totalPaginas, p3.pagina], [25, 3, 3]);
    const ids = [...p1.resultados, ...p2.resultados, ...p3.resultados].map((x) => x.id);
    assert.equal(new Set(ids).size, 25);
  });

  it('el orden es determinista y una página fuera de rango devuelve lista vacía con el total', () => {
    const a = idx.buscar({ q: 'paginable', pagina: 2, porPagina: 10 }).resultados.map((x) => x.id);
    const b = idx.buscar({ q: 'paginable', pagina: 2, porPagina: 10 }).resultados.map((x) => x.id);
    assert.deepEqual(a, b);
    const fuera = idx.buscar({ q: 'paginable', pagina: 9, porPagina: 10 });
    assert.equal(fuera.resultados.length, 0);
    assert.equal(fuera.total, 25);
    assert.equal(fuera.totalPaginas, 3);
  });
});

describe('DUI en la nueva búsqueda', () => {
  it('encuentra por DUI en números, sin guion y en letras, y remarca el lugar exacto', () => {
    const idx = new DiarioIndex();
    idx.addRecord(rec({ id: 'd-1', contenido: 'Sentencia contra el señor, con Documento Único de Identidad número 02444983-6, en rebeldía.', duisEncontrados: ['02444983-6'] }));
    idx.addRecord(rec({ id: 'd-2', pagina: 51, contenido: 'Documento Único de Identidad número CERO DOS CUATRO CUATRO CUATRO NUEVE OCHO TRES - SEIS de otra persona.' }));
    for (const q of ['02444983-6', '024449836']) {
      const r = idx.buscar({ q });
      const x = r.resultados.find((y) => y.id === 'd-1')!;
      assert.equal(x.coincidenciaExacta, true);
      const f = x.coincidencias.find((c) => c.ubicacion === 'cuerpo')!;
      assert.deepEqual(marcado(f.html), ['02444983-6']);
    }
    const letras = idx.buscar({ q: 'cero dos cuatro cuatro cuatro nueve ocho tres seis' });
    assert.ok(letras.resultados.some((x) => x.id === 'd-1'));
    assert.ok(letras.resultados.some((x) => x.id === 'd-2'));
  });
});

describe('Rendimiento sobre el corpus real', () => {
  it('p95 por debajo de 150 ms (y la indexación es única, no por petición)', () => {
    const t0 = performance.now();
    const idx = new DiarioIndex();
    idx.addBatch(corpus.map((r) => ({ ...r })));
    assert.ok(performance.now() - t0 < 3000, 'indexación inicial razonable');
    const consultas = ['zonas francas', 'SANCHIA INTERNATIONAL', '755', 'Tránsito', 'TRIBUTARIAS', 'herencia', 'juzgado civil', '"beneficio de inventario"', 'acuerdo 15', 'junta general', 'octubre 2026', 'San Salvador', 'sucesión intestada', 'cuatro días', 'notario'];
    const tiempos: number[] = [];
    for (let i = 0; i < 8; i++) {
      for (const q of consultas) {
        const t = performance.now();
        idx.buscar({ q });
        tiempos.push(performance.now() - t);
      }
    }
    tiempos.sort((a, b) => a - b);
    const p95 = tiempos[Math.floor(tiempos.length * 0.95)]!;
    assert.ok(p95 < 150, `p95=${p95.toFixed(2)} ms`);
  });
});

describe('Interfaz: núcleo compartido con el navegador, accesibilidad y contraste', () => {
  const ctx: Record<string, unknown> = {
    getLegalClassificationBadge: (l: string) => `<span>${l}</span>`,
    renderDuiChipsHtml: () => ''
  };
  vm.createContext(ctx);
  vm.runInContext(`${RESALTADO_CLIENT_JS}\n${BUSQUEDA_CLIENT_JS}`, ctx);
  const run = <T,>(code: string): T => vm.runInContext(code, ctx) as T;

  it('el navegador resalta igual que el servidor', () => {
    const texto = 'Facilidades para el Cumplimiento Voluntario de Obligaciones Tributarias, Aduaneras, de Tránsito y Otras Multas.';
    ctx.T = texto;
    for (const q of ['tránsito', 'TRIBUTARIAS aduaneras', '"obligaciones tributarias"']) {
      ctx.Q = q;
      assert.equal(run<string>('gsResaltarConsulta(T, Q, "gs-mark", "")'), nucleo.resaltarConsulta(texto, q, 'gs-mark', ''), q);
    }
  });

  it('el navegador escapa HTML aunque el texto traiga etiquetas', () => {
    ctx.T = '<script>alert(1)</script> amnistía';
    ctx.Q = 'amnistia';
    const html = run<string>('gsResaltarConsulta(T, Q, "highlight-clickable", "")');
    assert.ok(!html.includes('<script'));
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(html.includes('<mark class="highlight-clickable">amnistía</mark>'));
  });

  it('la tarjeta muestra primero la identificación y luego los fragmentos rotulados', () => {
    const idx = new DiarioIndex();
    idx.addBatch(corpus.map((r) => ({ ...r })));
    const data = idx.buscar({ q: '"incisos arancelarios"' });
    assert.ok(data.total >= 1);
    ctx.D = JSON.parse(JSON.stringify(data));
    const html = run<string>('gsHtmlTarjeta(D.resultados[0])');
    const iTitulo = html.indexOf('<h4');
    const iFragmento = html.indexOf('Coincide en: ');
    assert.ok(iTitulo > 0 && iFragmento > iTitulo, 'identificación antes que fragmentos');
    assert.ok(html.includes('Órgano emisor'));
    assert.match(html, /<mark class="gs-mark">incisos arancelarios<\/mark>/i);
    const resumen = run<string>('gsHtmlResumen(D)');
    assert.match(resumen, /Se encontr(ó|aron) \d+ publicaci/);
  });

  it('la portada declara aria-live, límite de 200 caracteres y estilo <mark> con contraste suficiente', () => {
    const html = renderPortal({ totalDocumentos: 1, totalAlertas: 0, diarios: cargarCatalogo() });
    assert.match(html, /id="search-resumen" role="status" aria-live="polite"/);
    assert.match(html, /id="results-container"[^>]*aria-live="polite"/);
    assert.match(html, /id="query-input" maxlength="200"/);
    assert.match(html, /mark\.gs-mark \{[^}]*background: #fde047;[^}]*color: #0f172a;/);
    const lum = (hex: string): number => {
      const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
    };
    const [a, b] = [lum('#fde047'), lum('#0f172a')];
    assert.ok((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 7, 'contraste AAA');
  });

  it('el visor ya no construye RegExp con el texto del usuario', () => {
    const html = renderPortal({ totalDocumentos: 1, totalAlertas: 0, diarios: cargarCatalogo() });
    // El visor resalta con el mismo núcleo por tokens que el servidor (nunca RegExp con el texto del usuario)
    assert.ok(html.includes("gsResaltarConsulta(r.contenido, VZ.term, 'vz-m', '')"));
    assert.ok(!html.includes("new RegExp('(' + patterns.join('|') + ')', 'gi')"));
    assert.ok(!/new RegExp\([^)]*(VZ\.term|term)/.test(html), 'ninguna RegExp se construye con el término buscado');
  });
});
