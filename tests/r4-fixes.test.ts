import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluarCriterio } from '../src/criterio.js';
import { validarAlerta } from '../src/alert_validation.js';
import { DiarioIndex } from '../src/indexer.js';
import { renderPortal } from '../src/views.js';

const base = { usuarioEmail: 'a@b.com', consentimiento: true };

describe('Ronda 4: alertas rechazan criterios basura (R3-002)', () => {
  it('rechaza DUI con verificador inválido o incompleto, con avisos en español', () => {
    const malo = validarAlerta({ ...base, criterioBusqueda: '12345678-9' });
    assert.ok(!malo.ok && /verificador/.test(malo.error));
    const corto = validarAlerta({ ...base, criterioBusqueda: '00356274' });
    assert.ok(!corto.ok && /incompleto/.test(corto.error));
  });
  it('rechaza etiquetas HTML y símbolos sueltos', () => {
    const script = validarAlerta({ ...base, criterioBusqueda: '<script>alert(1)</script>' });
    assert.ok(!script.ok && /etiquetas/.test(script.error));
    const simbolos = validarAlerta({ ...base, criterioBusqueda: '%%%%%%' });
    assert.ok(!simbolos.ok && /letras o números/.test(simbolos.error));
    assert.equal(validarAlerta({ ...base, criterioBusqueda: 'Juan; DROP TABLE' }).ok, false);
  });
  it('acepta DUI válido (normalizado) y nombres con tildes', () => {
    const dui = validarAlerta({ ...base, criterioBusqueda: '000000000' });
    assert.ok(dui.ok && dui.value.criterioBusqueda === '00000000-0' && dui.value.tipoCriterio === 'DUI');
    const nombre = validarAlerta({ ...base, criterioBusqueda: "María José Ñandú O'Brien" });
    assert.ok(nombre.ok && nombre.value.tipoCriterio === 'NOMBRE');
  });
  it('el navegador usa la misma función que el servidor', () => {
    const html = renderPortal({ totalDocumentos: 1, totalAlertas: 0 });
    assert.ok(html.includes('function evaluarCriterio(entrada)'));
    assert.ok(html.includes('const evaluado = evaluarCriterio(crit);'));
    assert.ok(html.includes('escapeHtmlText(q)'));
    assert.equal(evaluarCriterio('abc').ok, true);
  });
});

describe('Ronda 4: la búsqueda avisa de consultas mal formadas (R3-003)', () => {
  const idx = new DiarioIndex();
  it('«DUI» con letras y etiquetas HTML son entrada inválida', () => {
    for (const q of ['abcdefgh-1', '<script>alert(1)</script>', '%%%%%%']) {
      const r = idx.search(q);
      assert.equal(r.entradaInvalida, true, q);
      assert.ok(r.aviso, q);
    }
  });
  it('un texto legítimo con signos comunes no se marca como inválido', () => {
    assert.notEqual(idx.search('Decreto 12/2020').entradaInvalida, true);
  });
});
