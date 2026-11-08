import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validarAlerta } from '../src/alert_validation.js';
import { renderPortal } from '../src/views.js';
import { renderPrivacidad } from '../src/privacidad.js';

describe('Ronda 7: privacidad', () => {
  const base = { criterioBusqueda: '00000000-0', usuarioEmail: 'a@b.com' };
  it('el servidor rechaza alertas sin consentimiento', () => {
    assert.equal(validarAlerta(base).ok, false);
    assert.equal(validarAlerta({ ...base, consentimiento: 'true' }).ok, false);
    assert.equal(validarAlerta({ ...base, consentimiento: true }).ok, true);
  });
  it('la portada no contiene DUI ni nombres reales de ejemplo ni about:blank', () => {
    const html = renderPortal({ totalDocumentos: 1, totalAlertas: 0 });
    for (const v of ['00356274', '003562742', '01239641', 'DEMAR ALBERTO', 'about:blank']) assert.ok(!html.includes(v), v);
    assert.ok(html.includes('id="alert-consent"') && html.includes('href="/privacidad"'));
  });
  it('existe la página de privacidad', () => {
    assert.ok(renderPrivacidad().includes('Grupo Stu, S.A.S.'));
  });
});
