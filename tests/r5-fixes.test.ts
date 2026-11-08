import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderPortal } from '../src/views.js';

describe('Ronda 5: aviso de página fuera de rango (R4-004)', () => {
  const html = renderPortal({ totalDocumentos: 1, totalAlertas: 0 });
  it('usa una franja propia con aria-live, sin flotar sobre el contenido', () => {
    const tag = html.match(/<div id="pdf-range-notice"[^>]*>/)?.[0] ?? '';
    assert.match(tag, /aria-live="polite"/);
    assert.match(tag, /role="status"/);
    assert.doesNotMatch(tag, /\b(fixed|absolute)\b/);
  });
  it('se oculta solo a los 3 segundos y ya no usa la cápsula flotante', () => {
    assert.match(html, /function showPageRangeNotice[\s\S]*?\}, 3000\)/);
    assert.match(html, /showPageRangeNotice\('El tomo tiene páginas de la 1 a la 164\.'\)/);
    assert.doesNotMatch(html, /showFloatingRadar\('El tomo tiene páginas/);
  });
});
