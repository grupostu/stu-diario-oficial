// Calidad del corpus data_diario_real.json y de la experiencia de búsqueda (Diarios Oficiales).
// CORPUS_PATH permite apuntar a otro archivo (p. ej. para comprobar que las pruebas fallan ante datos sucios).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { DiarioRecord } from '../src/types.js';
import { extractDuis, extractNits } from '../src/parser.js';
import { extractCardinalDuis, parseSpanishCardinal } from '../src/dui_words.js';
import { dehyphenate, fixOcrCase, normalizeText, stripGazetteNoise } from '../src/text_clean.js';
import { construirTitular, extraerAutoridad, extraerCausante } from '../src/titles.js';
import { curarCorpus, esContinuacion, fusionarContinuaciones } from '../src/curate.js';
import { DiarioIndex, plegarTexto } from '../src/indexer.js';
import { resolverEnlaceVisor } from '../src/visor.js';

const RUTA = process.env.CORPUS_PATH ?? path.join(process.cwd(), 'src', 'data_diario_real.json');
const corpus: DiarioRecord[] = JSON.parse(fs.readFileSync(RUTA, 'utf8'));
const CATEGORIAS = new Set(['EDICTO_JUDICIAL', 'REGISTRO_MARCA', 'DECRETO_LEGISLATIVO', 'ACUERDO_EJECUTIVO', 'SUBASTA_EMBARGO', 'BALANCE_FINANCIERO', 'GENERAL']);

const rec = (over: Partial<DiarioRecord>): DiarioRecord => ({
  id: 'x-1', tomo: 453, numero: 198, fecha: '2026-10-23', pagina: 50, categoria: 'EDICTO_JUDICIAL', seccion: 's',
  titular: 't', contenido: 'c', duisEncontrados: [], nitsEncontrados: [], nombresClave: [], pdfUrlOficial: '/pdf/23-10-2026.pdf#page=50', ...over
});

describe('Corpus real: pureza documental (sin marcas de agua ni basura OCR)', () => {
  it('no contiene marcas de agua, cabeceras de página ni líneas de sumario con puntos guía', () => {
    for (const r of corpus) {
      assert.doesNotMatch(r.contenido, /DOCUMENTO SOLO PARA CONSULTA/i, r.id);
      assert.doesNotMatch(r.contenido, /^\s*\d{0,4}\s*DIARIO OFICIAL\b.*(TOMO|San Salvador)/im, r.id);
      assert.doesNotMatch(r.contenido, /\.{5,}/, r.id);
      assert.ok(!r.contenido.includes('�') && !r.titular.includes('�'), `${r.id} con carácter de reemplazo`);
    }
  });

  it('reconstruye palabras guionadas al final de línea (DEPARTA-\\nMENTO)', () => {
    const malos = corpus.filter((r) => /[a-záéíóúñ]-[ \t]*\n[ \t]*[a-záéíóúñ]/i.test(r.contenido)).map((r) => r.id);
    assert.deepEqual(malos, [], `${malos.length} registros con palabras partidas`);
  });

  it('no deja rótulos con mayúsculas alternadas por OCR (acEPTacioN, HErENcia)', () => {
    for (const r of corpus) {
      const tokens = r.contenido.match(/[A-Za-zÁÉÍÓÚÑáéíóúñ]{4,}/g) ?? [];
      const sucios = tokens.filter((t) => /[a-zñáéíóú][A-ZÑÁÉÍÓÚ]/.test(t) && !/^Mc[A-Z]/.test(t));
      assert.deepEqual(sucios, [], r.id);
    }
  });

  it('usa solo categorías canónicas del tipo CategoryType y ids únicos', () => {
    const ids = new Set<string>();
    for (const r of corpus) {
      assert.ok(CATEGORIAS.has(r.categoria), `${r.id}: categoría ${r.categoria} no canónica`);
      assert.ok(!ids.has(r.id), `id duplicado ${r.id}`);
      ids.add(r.id);
    }
  });
});

describe('Corpus real: titulares que reflejan el acto jurídico', () => {
  it('ningún titular tiene saltos de línea, números de inserción ni cola truncada', () => {
    for (const r of corpus) {
      assert.doesNotMatch(r.titular, /\n/, `${r.id}: salto de línea`);
      assert.doesNotMatch(r.titular, /\d+\s*v\.\s*(alt\.)?\s*No\./i, `${r.id}: número de inserción en titular`);
      assert.doesNotMatch(r.titular, /\(Edicto #\d+\)/, `${r.id}: sumario "Edicto #N"`);
      assert.doesNotMatch(r.titular, /\b(de|del|la|el|los|las|en|y)\s*$/i, `${r.id}: termina en preposición`);
      assert.doesNotMatch(r.titular, /^(Autoridad Judicial|Notarial (Ubicad|Situad)|Juez (De|Primero))/, `${r.id}: titular genérico: ${r.titular}`);
      assert.ok(r.titular.length >= 8 && r.titular.length <= 160, `${r.id}: largo ${r.titular.length}`);
    }
  });

  it('los edictos de herencia declaran el acto (aceptación, declaratoria, curador) en el titular', () => {
    const herencia = corpus.filter((r) => /beneficio de inventario/i.test(r.contenido) && r.categoria === 'EDICTO_JUDICIAL');
    assert.ok(herencia.length > 50);
    for (const r of herencia) {
      assert.match(r.titular, /^(Aceptación de herencia|Declaratoria de heredero|Herencia yacente|Edicto de sucesión|Título|Delimitación|Reposición|Convocatoria|Declaratoria de muerte|Rectificación|Emplazamiento|Aviso|Nombramiento|Balance)/, `${r.id}: ${r.titular}`);
    }
  });

  it('al menos el 85% de los titulares de sucesión identifican al causante', () => {
    const suc = corpus.filter((r) => /^(Aceptación de herencia|Declaratoria de heredero)/.test(r.titular));
    const conNombre = suc.filter((r) => / · [A-ZÁÉÍÓÚÑ]/.test(r.titular));
    assert.ok(conNombre.length / suc.length >= 0.85, `${conNombre.length}/${suc.length}`);
  });
});

describe('Corpus real: DUIs/NITs asociados al edicto correcto', () => {
  it('cada registro lista exactamente los DUIs que su propio texto contiene', () => {
    for (const r of corpus) {
      assert.deepEqual([...r.duisEncontrados].sort(), extractDuis(r.contenido).sort(), r.id);
      assert.deepEqual([...r.nitsEncontrados].sort(), extractNits(r.contenido).sort(), `${r.id} NIT`);
    }
  });

  it('una matrícula registral escrita en letras no se confunde con un DUI', () => {
    const r = corpus.find((x) => /NUEVE CERO UNO CERO CINCO UNO SEIS TRES/i.test(x.contenido));
    assert.ok(r, 'registro con matrícula');
    assert.ok(!r!.duisEncontrados.includes('90105163-0'));
  });

  it('el índice devuelve cada edicto al buscar cualquiera de sus DUIs', () => {
    const idx = new DiarioIndex();
    idx.addBatch(corpus.map((r) => ({ ...r })));
    for (const r of corpus) {
      for (const dui of r.duisEncontrados) {
        const res = idx.search(dui);
        assert.ok(res.results.some((x) => x.diario.id === r.id), `${dui} no devuelve ${r.id}`);
      }
    }
  });

  it('todo DUI del corpus tiene formato 8-1 y no se repite entre edictos distintos sin razón', () => {
    const vistos = new Map<string, string[]>();
    for (const r of corpus) for (const d of r.duisEncontrados) {
      assert.match(d, /^\d{8}-\d$/);
      vistos.set(d, [...(vistos.get(d) ?? []), r.id]);
    }
    const repetidos = [...vistos.entries()].filter(([, ids]) => ids.length > 2);
    assert.deepEqual(repetidos, []);
  });
});

describe('Extracción de DUI en letras', () => {
  it('lee DUI cardinal ("cero dos millones treinta y seis mil ... - ocho")', () => {
    assert.deepEqual(extractCardinalDuis('Documento Único de Identidad número cero dos millones treinta y seis mil seiscientos ochenta y cinco - ocho; quien'), ['02036685-8']);
    assert.deepEqual(extractDuis('Identidad Número cero cero seiscientos ocho mil cuatrocientos setenta-uno; habiéndosele'), ['00608470-1']);
    assert.equal(parseSpanishCardinal(['un', 'millón', 'quinientos', 'noventa', 'y', 'ocho', 'mil', 'cuarenta', 'y', 'seis']), 1598046);
  });

  it('reconoce DUIs con guion y salto de línea entre palabras, y descarta matrículas', () => {
    assert.deepEqual(extractDuis('Identidad número cero dos cuatro cuatro siete cinco cero cinco-\nsiete; de parte'), ['02447505-7']);
    assert.deepEqual(extractDuis('matrícula NUEVE CERO UNO CERO CINCO UNO SEIS TRES-CERO CERO CERO CERO CERO en el asiento'), []);
  });

  it('un DUI cuyo dígito final está partido por guion ("cua-\\ntro") se recupera tras la higiene', () => {
    const t = normalizeText('Identidad cero uno cinco tres nueve uno dos cinco- cua-\ntro; de la HERENCIA');
    assert.deepEqual(extractDuis(t), ['01539125-4']);
  });
});

describe('Higiene de texto', () => {
  it('dehyphenate une palabras pero conserva el guion entre dígitos en letras', () => {
    assert.equal(dehyphenate('DEPARTA-\nMENTO de San Miguel'), 'DEPARTAMENTO de San Miguel');
    assert.equal(dehyphenate('cinco-\nsiete'), 'cinco-siete');
  });
  it('fixOcrCase y stripGazetteNoise', () => {
    assert.equal(fixOcrCase('acEPTacioN DE HErENcia iNTEriNa'), 'ACEPTACION DE HERENCIA INTERINA');
    assert.equal(fixOcrCase('Juan McDonald'), 'Juan McDonald');
    const sucio = 'Texto\nDOCUMENTO SOLO PARA CONSULTA\n10 DIARIO OFICIAL.- San Salvador, 23 de octubre de 2026\nSumario ........ 12\nFin del edicto en el DIARIO OFICIAL y en otro periódico';
    assert.equal(stripGazetteNoise(sucio), 'Texto\nFin del edicto en el DIARIO OFICIAL y en otro periódico');
  });
});

describe('Titulares', () => {
  const cuerpo = '1 v. No. F53816\nLICENCIADA DINORA DEL CARMEN ANDRADE DE LAZO,\nJUEZ QUINTO DE LO CIVIL Y MERCANTIL DEL DISTRITO DE\nCHINAMECA, MUNICIPIO DE SAN MIGUEL OESTE.\n\nHACE SABER: Que SE DECLARÓ HEREDERO DEFINITIVO de la herencia intestada que al fallecer dejó la causante señora REINA ONIS GAVIDIA DE HERNÁNDEZ, quien fue de';
  it('arma "<acto> · <causante> — <autoridad>" sin número de inserción', () => {
    assert.equal(construirTitular(cuerpo), 'Declaratoria de heredero definitivo · Reina Onis Gavidia de Hernández — Juzgado Quinto de lo Civil y Mercantil de Chinameca');
  });
  it('extrae causante y no arrastra la siguiente oración', () => {
    assert.equal(extraerCausante('la herencia que dejó el causante señor José Santos Romero. Lo que se avisa'), 'José Santos Romero');
    assert.equal(extraerAutoridad('Librado en el Juzgado de lo Civil, del Distrito judicial de Usulután'), 'Juzgado de lo Civil de Usulután');
  });
  it('un notario se identifica por nombre y no por "Salvadoreño"/"Supletorio"', () => {
    assert.equal(extraerAutoridad('TITULO SUPLETORIO\nDORA MARIA MENENDEZ FERNANDEZ, Notario, del domicilio'), 'Notario Dora Maria Menendez Fernandez');
  });
});

describe('Fusión de continuaciones de edictos partidos', () => {
  it('une la cola "Librado en..." con su edicto cuando el anterior no está firmado', () => {
    const a = rec({ id: 'a', pagina: 49, contenido: 'HACE SABER: que se declaró heredero\nde la sucesión.' });
    const b = rec({ id: 'b', pagina: 50, contenido: 'Librado en el Juzgado Primero de lo Civil. LICDA. X, SECRETARIA.' });
    assert.equal(esContinuacion(b, a), true);
    const out = fusionarContinuaciones([a, b]);
    assert.equal(out.length, 1);
    assert.match(out[0]!.contenido, /sucesión\.\nLibrado en el Juzgado/);
  });
  it('no fusiona edictos independientes', () => {
    const a = rec({ id: 'a', contenido: 'HACE SABER: x. Librado en el Juzgado. LICDA. SECRETARIA.' });
    const b = rec({ id: 'b', contenido: 'LICDA. OTRA PERSONA, JUEZ\nHACE SABER: y' });
    assert.equal(fusionarContinuaciones([a, b]).length, 2);
  });
  it('curarCorpus es idempotente', () => {
    const una = curarCorpus(corpus);
    const dos = curarCorpus(una);
    assert.deepEqual(dos.map((r) => [r.id, r.titular, r.contenido]), una.map((r) => [r.id, r.titular, r.contenido]));
  });
});

describe('Experiencia de búsqueda', () => {
  const idx = new DiarioIndex();
  idx.addRecord(rec({ id: 'do-1-a', contenido: 'Sucesión de JUAN\nJOSÉ ALVAREZ NÚÑEZ, del domicilio de Chapeltique.', titular: 'Aceptación de herencia intestada · Juan José Alvarez Núñez' }));
  idx.addRecord(rec({ id: 'do-1-b', contenido: 'Edicto de MARÍA ALVAREZ, otro departamento.', titular: 'Edicto' }));

  it('encuentra sin acentos, sin importar mayúsculas ni saltos de línea', () => {
    assert.equal(idx.search('jose alvarez').total, 1);
    assert.equal(idx.search('NUNEZ').total, 1);
    assert.equal(idx.search('maria alvarez').results[0]!.diario.id, 'do-1-b');
  });
  it('encuentra por palabras en cualquier orden y prioriza la frase exacta', () => {
    const r = idx.search('alvarez juan');
    assert.equal(r.results[0]!.diario.id, 'do-1-a');
    const r2 = idx.search('alvarez');
    assert.equal(r2.total, 2);
  });
  it('resalta el término aunque cambien acentos y saltos de línea', () => {
    const r = idx.search('juan jose');
    assert.match(r.results[0]!.snippet, /<mark[^>]*>JUAN\s+JOSÉ<\/mark>/);
  });
  it('plegarTexto mapea posiciones al texto original', () => {
    const { plano, mapa } = plegarTexto('Ñandú  \n X');
    assert.equal(plano, 'nandu x');
    assert.equal(mapa[0], 0);
  });
  it('busca por DUI y por texto sobre el corpus real en milisegundos', () => {
    const full = new DiarioIndex();
    full.addBatch(corpus.map((r) => ({ ...r })));
    const conDui = corpus.find((r) => r.duisEncontrados.length)!;
    let t = performance.now();
    const porDui = full.search(conDui.duisEncontrados[0]!);
    assert.ok(performance.now() - t < 15, 'DUI < 15 ms');
    assert.ok(porDui.total >= 1);
    t = performance.now();
    full.search('beneficio de inventario');
    assert.ok(performance.now() - t < 50, 'texto < 50 ms');
  });
});

describe('Enlace directo al Visor (/visor?id=...)', () => {
  const idx = new DiarioIndex();
  idx.addBatch(corpus.map((r) => ({ ...r })));
  it('cada publicación resuelve a su folio PDF', () => {
    for (const r of corpus) {
      const url = resolverEnlaceVisor(idx, r.id);
      assert.equal(url, r.pdfUrlLocal ?? r.pdfUrlOficial, r.id);
      assert.match(url!, /^\/pdf\/[\w.-]+\.pdf#page=\d+$/);
    }
  });
  it('rechaza ids inexistentes o maliciosos', () => {
    assert.equal(resolverEnlaceVisor(idx, 'no-existe-123'), null);
    assert.equal(resolverEnlaceVisor(idx, '../../etc/passwd'), null);
    assert.equal(resolverEnlaceVisor(idx, undefined), null);
  });
});
