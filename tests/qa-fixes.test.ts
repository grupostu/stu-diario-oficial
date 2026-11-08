import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDuiInput, validarDigitoDui } from '../src/parser.js';
import { validarAlerta } from '../src/alert_validation.js';

describe('DUI incompleto (H-013)', () => {
  it('8 dígitos sin separador no se rellenan con ceros', () => {
    const r = normalizeDuiInput('00356274');
    assert.equal(r.isValidDui, false);
    assert.equal(r.incomplete, true);
  });
  it('con verificador separado sí se completa', () => {
    assert.equal(normalizeDuiInput('356274-2').canonical, '00356274-2');
  });
  it('valida el dígito verificador', () => {
    assert.equal(validarDigitoDui('003562742'), true);
    assert.equal(validarDigitoDui('123456789'), false);
    assert.equal(normalizeDuiInput('12345678-9').checkDigitOk, false);
  });
});

describe('Validación de alertas (H-015)', () => {
  const base = { criterioBusqueda: '00000000-0', usuarioEmail: 'a@b.com', consentimiento: true };
  it('acepta datos válidos y detecta DUI', () => {
    const r = validarAlerta(base);
    assert.ok(r.ok && r.value.tipoCriterio === 'DUI');
  });
  it('rechaza criterio corto, correo malo y teléfono inválido', () => {
    assert.equal(validarAlerta({ ...base, criterioBusqueda: 'a' }).ok, false);
    assert.equal(validarAlerta({ ...base, usuarioEmail: 'x' }).ok, false);
    assert.equal(validarAlerta({ ...base, telefonoWhatsapp: 'abc' }).ok, false);
    assert.equal(validarAlerta(null).ok, false);
  });
});
