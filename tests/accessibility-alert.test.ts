import assert from 'node:assert/strict';
import test from 'node:test';
import { renderPortal } from '../src/views.js';

test('el formulario de alertas tiene controles etiquetados y un diálogo operable con teclado', () => {
  const html = renderPortal({ totalDocumentos: 0, totalAlertas: 0, diarios: [] });

  assert.match(html, /role="dialog" aria-modal="true" aria-labelledby="alert-modal-title"/);
  assert.match(html, /id="alert-modal-title"/);
  assert.match(html, /<label for="alert-criterion"/);
  assert.match(html, /<label for="alert-email"/);
  assert.match(html, /<label for="alert-phone"/);
  assert.match(html, /modal\.setAttribute\('aria-hidden', 'false'\)/);
  assert.match(html, /event\.key === 'Escape'/);
  assert.match(html, /event\.key !== 'Tab'/);
  assert.match(html, /handleAlertDialogFocusIn/);
  assert.match(html, /sibling\.inert = true/);
  assert.match(html, /restoreAlertBackground\(\)/);
  assert.match(html, /if \(alertRequestPending\) return/);
  assert.match(html, /alertOpenGeneration/);
  assert.match(html, /generation === alertOpenGeneration/);
  assert.match(html, /alertSuccessfulPayloadKey === getAlertPayloadKey\(\)/);
  assert.match(html, /control\.disabled = pending/);
  assert.match(html, /if \(alertRequestPending\) modal\.querySelector\('button\[aria-label="Cerrar"\]'\)\.focus\(\)/);
  assert.match(html, /new AbortController\(\)/);
  assert.match(html, /setTimeout\(\(\) => controller\.abort\(\), 30000\)/);
  assert.doesNotMatch(html, /setTimeout\(closeModalAlert/);
  assert.match(html, /Enviando alerta\. Los campos quedan bloqueados hasta recibir respuesta\./);
  assert.match(html, /previousAlertFocus\.focus\(\)/);
});
