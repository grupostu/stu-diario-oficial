import { escapeHtml as esc } from './html.js';
import { MASTER_FOOTER_HTML } from './master-footer.js';

/** Tema: claro por defecto; el oscuro es un modo conmutable que se recuerda en localStorage ('stu-theme'). */
export const THEME_BOOT =
  "(function(){var t='light';try{var s=localStorage.getItem('stu-theme');if(s==='dark'||s==='light')t=s;}catch(_){}document.documentElement.setAttribute('data-theme',t);})();";


/**
 * Página sencilla con la identidad compartida (404, errores, privacidad, vista OCR):
 * tema claro por defecto, cabecera única de Stu_UI (panel de apps cerrado) y pie institucional generado.
 * `cuerpo` es HTML ya escapado por quien llama.
 */
export function renderPaginaBase(opts: { titulo: string; descripcion?: string; cuerpo: string; noindex?: boolean; centrado?: boolean }): string {
  return `<!DOCTYPE html>
<html lang="es" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(opts.titulo)} · Diarios Oficiales de El Salvador</title>
  ${opts.descripcion ? `<meta name="description" content="${esc(opts.descripcion)}">` : ''}
  ${opts.noindex ? '<meta name="robots" content="noindex">' : ''}
  <script>${THEME_BOOT}</script>
  <link rel="stylesheet" href="/stu-ui/tokens.css?v=1">
  <link rel="stylesheet" href="/stu-ui/cabecera/cabecera.css?v=1">
  <style>
    body { margin: 0; min-height: 100vh; display: flex; flex-direction: column; background: var(--gs-bg); color: var(--gs-text); font: 16px/1.65 var(--gs-font, system-ui, sans-serif); }
    stu-cabecera { display: block; position: sticky; top: 0; z-index: 100; }
    stu-cabecera .stu-cabecera-panel:not(.is-open) { display: none; }
    main { flex: 1; width: 100%; box-sizing: border-box; padding: 48px var(--gs-gutter, 16px) 64px; }
    main.centrado { display: flex; align-items: center; justify-content: center; text-align: center; }
    .contenido { max-width: 760px; margin: 0 auto; }
    h1 { font-size: 1.75rem; font-weight: 600; margin: 0 0 8px; }
    h2 { font-size: 1.15rem; font-weight: 600; margin: 2rem 0 .5rem; }
    p { color: var(--gs-text-2); }
    a { color: var(--gs-accent); }
    li { margin: .3rem 0; color: var(--gs-text-2); }
    .btn { display: inline-block; background: var(--gs-accent); color: var(--gs-accent-ink); padding: 10px 20px; border-radius: 8px; font-weight: 500; text-decoration: none; }
    .btn:hover { background: var(--gs-accent-hover); }
    @media (max-width: 420px) { stu-cabecera .stu-cabecera__brand-name, stu-cabecera .stu-cabecera__separator { display: none; } }
  </style>
</head>
<body>
  <stu-cabecera platform="diarios" platform-name="Diarios Oficiales" platform-url="https://diariosoficiales.grupostu.com" login-url="https://cuenta.grupostu.com/login"></stu-cabecera>
  <main${opts.centrado ? ' class="centrado"' : ''}>${opts.cuerpo}</main>
  ${MASTER_FOOTER_HTML}
  <script type="module" src="/stu-ui/cabecera/cabecera.js?v=1"></script>
</body>
</html>`;
}

/** Página 404 / error con la identidad compartida. */
export function renderError(codigo: number, titulo: string, mensaje: string): string {
  return renderPaginaBase({
    titulo, noindex: true, centrado: true,
    cuerpo: `<div><h1>${esc(titulo)}</h1><p>${esc(mensaje)}</p><a class="btn" href="/">Volver al buscador</a></div>`
  }).replace('<html lang="es"', `<html lang="es" data-error="${codigo}"`);
}
