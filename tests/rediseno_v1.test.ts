import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderPaginaBase, renderError, THEME_BOOT } from '../src/pagina_base.js';
import { renderPrivacidad } from '../src/privacidad.js';

const leer = (r: string) => readFileSync(new URL(`../${r}`, import.meta.url), 'utf8');
const views = leer('src/views.ts');
const visor = leer('src/visor_cliente.ts');

describe('Rediseño V1: identidad compartida', () => {
  it('tema claro por defecto, con script de tema antes de los estilos y modo oscuro conmutable', () => {
    assert.match(views, /<html lang="es" data-theme="light">/);
    assert.ok(views.indexOf('${THEME_BOOT}') < views.indexOf('/stu-ui/tokens.css'));
    assert.match(THEME_BOOT, /stu-theme/);
    assert.doesNotMatch(views, /theme-toggle="false"/);
  });
  it('sin utilidades oscuras fijas, degradados ni galería de ilustraciones en la portada y el visor', () => {
    for (const s of [views, visor]) {
      assert.doesNotMatch(s, /\b(bg|text|border)-slate-\d+/);
      assert.doesNotMatch(s, /gradient/);
    }
    assert.doesNotMatch(views, /gs-footer__gallery|Ecosistema/);
  });
  it('cabecera única y pie generado en portada, error y privacidad', () => {
    assert.equal((views.match(/<stu-cabecera/g) || []).length, 1);
    for (const h of [renderError(404, 'x', 'y'), renderPrivacidad()]) {
      assert.match(h, /<html lang="es" (data-error="\d+" )?data-theme="light">/);
      assert.equal((h.match(/<stu-cabecera/g) || []).length, 1);
      assert.match(h, /gs-footer/);
      assert.doesNotMatch(h, /gradient|illustration|galer/i);
    }
  });
  it('el panel de apps no arranca abierto y el contenido va a todo el ancho', () => {
    assert.match(views, /stu-cabecera \.stu-cabecera-panel:not\(\.is-open\) \{ display: none; \}/);
    assert.match(renderPaginaBase({ titulo: 't', cuerpo: '' }), /:not\(\.is-open\) \{ display: none; \}/);
    assert.doesNotMatch(views, /<main class="[^"]*max-w-/);
  });
});
