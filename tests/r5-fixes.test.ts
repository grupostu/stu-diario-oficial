import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderPortal } from '../src/views.js';
import { cargarCatalogo } from '../src/diarios.js';

describe('Ronda 5: aviso de página fuera de rango (R4-004)', () => {
  const html = renderPortal({ totalDocumentos: 1, totalAlertas: 0, diarios: cargarCatalogo() });
  it('usa una franja propia con aria-live, sin flotar sobre el contenido', () => {
    const tag = html.match(/<div id="pdf-range-notice"[^>]*>/)?.[0] ?? '';
    assert.match(tag, /aria-live="polite"/);
    assert.match(tag, /role="status"/);
    assert.doesNotMatch(tag, /\b(fixed|absolute)\b/);
  });
  it('se oculta solo, usa el total real de páginas y ya no usa la cápsula flotante', () => {
    // El aviso se oculta solo (temporizador) y el mensaje usa el total real del diario abierto, no un número fijo.
    assert.match(html, /function vzAviso[\s\S]*?setTimeout\([\s\S]*?, 3500\)/);
    assert.match(html, /vzAviso\('El tomo tiene páginas de la 1 a la ' \+ VZ\.diario\.paginas \+ '\.'\)/);
    assert.doesNotMatch(html, /showFloatingRadar\('El tomo tiene páginas/);
  });
});
