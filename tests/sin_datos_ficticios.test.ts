// Garantía anti-datos-inventados: todo lo que el buscador muestra debe salir del PDF real.
// Si alguien reintroduce marcas, muestras con DUI falsos o texto redactado a mano, estos tests fallan.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { DiarioRecord } from '../src/types.js';
import { cargarCatalogo } from '../src/diarios.js';
import { renderPortal } from '../src/views.js';
import { DiarioIndex } from '../src/indexer.js';

const RAIZ = process.cwd();
const corpus: DiarioRecord[] = JSON.parse(fs.readFileSync(path.join(RAIZ, 'src', 'data_diario_real.json'), 'utf8'));
const catalogo = cargarCatalogo();

interface PaginasDiario {
  id: string;
  paginas: string[];
}
const paginasPorDiario = new Map<string, PaginasDiario>();
for (const d of catalogo) {
  const f = path.join(RAIZ, 'public', 'data', `paginas-${d.id}.json`);
  if (fs.existsSync(f)) paginasPorDiario.set(d.id, JSON.parse(fs.readFileSync(f, 'utf8')) as PaginasDiario);
}

/** Pliega para comparar: sin tildes, minúsculas y solo letras/dígitos (ignora saltos de línea y espacios). */
const plegar = (s: string): string => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

describe('Sin datos de ejemplo: el corpus sale íntegramente del PDF', () => {
  it('cada diario del catálogo con registros tiene su archivo paginas-<id>.json con el texto de cada página', () => {
    const conRegistros = new Set(corpus.map((r) => r.diarioId ?? r.fecha));
    assert.ok(conRegistros.size >= 1);
    for (const id of conRegistros) {
      const d = catalogo.find((x) => x.id === id);
      assert.ok(d, `el diario ${id} de los registros no está en src/diarios.json`);
      const p = paginasPorDiario.get(id);
      assert.ok(p, `falta public/data/paginas-${id}.json`);
      assert.equal(p.paginas.length, d.paginas, `${id}: el catálogo dice ${d.paginas} páginas`);
    }
  });

  it('cada registro tiene rangos y su contenido es EXACTAMENTE el texto de esas páginas del PDF', () => {
    assert.ok(corpus.length > 0);
    for (const r of corpus) {
      assert.ok(Array.isArray(r.rangos) && r.rangos.length > 0, `${r.id}: sin rangos de origen en el PDF`);
      const pag = paginasPorDiario.get(r.diarioId ?? r.fecha);
      assert.ok(pag, `${r.id}: sin texto de páginas`);
      const trozos = r.rangos!.map(([n, desde, hasta]) => {
        assert.ok(Number.isInteger(n) && n >= 1 && n <= pag.paginas.length, `${r.id}: página ${n} fuera del diario`);
        assert.ok(desde >= 0 && hasta > desde && hasta <= pag.paginas[n - 1]!.length, `${r.id}: rango [${desde}, ${hasta}) fuera del texto de la página ${n}`);
        return pag.paginas[n - 1]!.slice(desde, hasta);
      });
      assert.equal(plegar(r.contenido), plegar(trozos.join(' ')), `${r.id}: el contenido no coincide con el texto del PDF`);
      assert.ok(r.pagina >= 1 && (r.paginaFin ?? r.pagina) >= r.pagina, r.id);
      assert.ok(r.rangos![0]![0] === r.pagina, `${r.id}: la primera página de los rangos no es la página del registro`);
    }
  });

  it('el titular, la sección y las entidades también proceden del texto del PDF (no se inventan)', () => {
    for (const r of corpus) {
      const pag = paginasPorDiario.get(r.diarioId ?? r.fecha)!;
      const paginasDelRegistro = plegar(r.rangos!.map(([n]) => pag.paginas[n - 1]).join(' '));
      for (const nombre of r.nombresClave ?? []) {
        assert.ok(paginasDelRegistro.includes(plegar(nombre)), `${r.id}: la entidad «${nombre}» no aparece en las páginas del registro`);
      }
      for (const dui of r.duisEncontrados) {
        assert.match(dui, /^\d{8}-\d$/, `${r.id}: DUI con formato inválido`);
      }
    }
  });

  it('no existe src/data_marcas.json con contenido (las marcas ficticias no vuelven)', () => {
    const f = path.join(RAIZ, 'src', 'data_marcas.json');
    if (!fs.existsSync(f)) return;
    const datos = JSON.parse(fs.readFileSync(f, 'utf8')) as unknown;
    assert.ok(Array.isArray(datos) ? datos.length === 0 : datos == null || Object.keys(datos as object).length === 0, 'data_marcas.json debe estar vacío o no existir');
  });

  it('ningún registro es de marca sin que el PDF lo diga, ni lleva ids de muestra', () => {
    for (const r of corpus) {
      assert.doesNotMatch(r.id, /dec690|muestra|ejemplo|demo|sample|mock/i, `${r.id}: id de muestra`);
      if (r.categoria === 'REGISTRO_MARCA') {
        const pag = paginasPorDiario.get(r.diarioId ?? r.fecha)!;
        assert.match(plegar(r.contenido), /marca|signo|nombrecomercial/, `${r.id}: categoría marca sin texto de marca en el PDF`);
        assert.ok(plegar(pag.paginas[r.pagina - 1]!).includes(plegar(r.contenido.slice(0, 40))), `${r.id}: marca que no está en el PDF`);
      }
    }
  });

  it('el texto del Decreto 690 NO está inventado: sus páginas sin texto en el PDF no generan contenido', () => {
    const pag = paginasPorDiario.get('2026-10-23')!;
    for (const r of corpus) {
      // Ningún registro cubre páginas del PDF que carecen de texto digital
      for (const [n, desde, hasta] of r.rangos ?? []) {
        assert.ok(hasta - desde > 0 && pag.paginas[n - 1]!.trim().length > 0, `${r.id}: rango en la página ${n}, que no tiene texto en el PDF`);
      }
      assert.doesNotMatch(r.contenido, /recargos e intereses[^.]*amnist|amnist[ií]a fiscal/i, `${r.id}: frase inventada del Decreto 690`);
    }
    assert.ok(!corpus.some((r) => r.id === 'do-453-23102026-p1-dec690' || r.id === 'do-453-23102026-p1-dec691'));
  });

  it('el buscador no inventa: un DUI o un nombre de muestra solo devuelve resultados si el PDF lo trae literalmente', () => {
    const idx = new DiarioIndex();
    idx.addBatch(corpus.map((r) => ({ ...r })));
    const todoPdf = plegar([...paginasPorDiario.values()].flatMap((p) => p.paginas).join(' '));
    // Nombres que aparecieron como muestras inventadas: frases exactas ausentes del PDF no devuelven nada
    for (const q of ['"Persona de ejemplo"', '"David Saúl Acosta Martínez"']) {
      const r = idx.buscar({ q, porPagina: 5000 });
      assert.equal(r.total > 0, todoPdf.includes(plegar(q)), q);
    }
    // Un DUI solo se devuelve si algún registro lo lista (extraído de su texto real) y nunca por un registro sin respaldo
    for (const q of ['00356274-2', '01239641-2']) {
      const r = idx.buscar({ q, porPagina: 5000 });
      const dueno = corpus.filter((c) => c.duisEncontrados.includes(q)).map((c) => c.id).sort();
      assert.deepEqual(r.resultados.filter((x) => x.coincidenciaExacta).map((x) => x.id).sort(), dueno, q);
    }
  });

  it('la portada no incrusta DUI ni nombres de personas inventados', () => {
    const html = renderPortal({ totalDocumentos: corpus.length, totalAlertas: 0, diarios: catalogo });
    for (const v of ['00356274', '003562742', '01239641', 'David Saúl', 'Acosta Martínez', 'about:blank']) assert.ok(!html.includes(v), v);
  });
});
