import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DiarioIndex } from '../src/indexer.js';
import { renderPortal } from '../src/views.js';
import { cargarCatalogo } from '../src/diarios.js';

describe('Ronda 3: entrada inválida nunca se presenta como «sin publicaciones» (R2-004)', () => {
  const idx = new DiarioIndex();
  it('DUI incompleto se marca como entrada inválida', () => {
    const r = idx.search('00356274');
    assert.equal(r.entradaInvalida, true);
    assert.ok(r.aviso);
  });
  it('DUI con verificador erróneo se marca como entrada inválida', () => {
    assert.equal(idx.search('12345678-9').entradaInvalida, true);
  });
  it('búsqueda vacía o de un solo carácter no devuelve resultados', () => {
    assert.equal(idx.search('').entradaInvalida, true);
    const r = idx.search('a');
    assert.equal(r.entradaInvalida, true);
    assert.equal(r.total, 0);
  });
  it('una consulta válida no se marca como inválida', () => {
    assert.notEqual(idx.search('casa').entradaInvalida, true);
  });
});

describe('Ronda 3: portal (R2-005, R2-006)', () => {
  const html = renderPortal({ totalDocumentos: 1, totalAlertas: 0, diarios: cargarCatalogo() });
  it('el formulario principal no usa validación nativa en inglés', () => {
    assert.match(html, /<form onsubmit="searchDiario\(event\)" novalidate/);
  });
  it('el visor ajusta la página al ancho y el aviso no tapa la barra', () => {
    // El visor ajusta la página al ancho en móvil (vzEscalaEfectiva) y su aviso vive en una franja propia, no flotante.
    assert.ok(html.includes('function vzEscalaEfectiva'));
    assert.match(html, /VZ\.ajuste && window\.innerWidth < 768/);
    const franja = html.match(/<div id="pdf-range-notice"[^>]*>/)?.[0] ?? '';
    assert.doesNotMatch(franja, /(fixed|absolute)/);
    assert.ok(html.includes('data.entradaInvalida'));
  });
});
