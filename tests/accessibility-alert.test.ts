import assert from 'node:assert/strict';
import test from 'node:test';
import { renderPortal } from '../src/views.js';

test('marcado del aviso y handlers de teclado del diálogo (comprobación estática)', () => {
  const html = renderPortal({ totalDocumentos: 0, totalAlertas: 0, diarios: [] });

  assert.match(html, /role="dialog" aria-modal="true" aria-labelledby="alert-modal-title"/);
  assert.match(html, /id="alert-modal-title"/);
  assert.match(html, /Las alertas por correo están temporalmente deshabilitadas/);
  assert.match(html, /no recopila ni guarda información/);
  assert.match(html, /consulta de publicaciones/);
  assert.doesNotMatch(html, /consulta y notificaciones|Vigilancia por DUI/);
  assert.doesNotMatch(html, /id="alert-(criterion|email|phone|consent)"/);
  assert.match(html, /modal\.setAttribute\('aria-hidden', 'false'\)/);
  assert.match(html, /event\.key === 'Escape'/);
  assert.match(html, /event\.key !== 'Tab'/);
  assert.match(html, /handleAlertDialogFocusIn/);
  assert.match(html, /sibling\.inert = true/);
  assert.match(html, /restoreAlertBackground\(\)/);
  assert.match(html, /modal\.querySelector\('button\[aria-label="Cerrar"\]'\)\.focus\(\)/);
  assert.doesNotMatch(html, /submitAlert|Guardar Alerta y Proteger mi Identidad/);
  assert.match(html, /previousAlertFocus\.focus\(\)/);
});
