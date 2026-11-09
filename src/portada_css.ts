// Hoja de estilos de la portada (antes en línea en views.ts). Contenido idéntico: se sirve como archivo estático versionado.
import { VISOR_CSS } from './visor_cliente.js';

export const PORTADA_CSS = `    body { font-family: var(--gs-font, system-ui, sans-serif); background: var(--gs-bg); color: var(--gs-text); }
    html, body { max-width: 100%; overflow-x: hidden; }
    /* Tap targets táctiles mínimos de 44px (móvil y tablet) */
    @media (pointer: coarse) {
      button, select, input:not([type=checkbox]):not([type=radio]), .tab-btn, summary { min-height: 44px; }
      a.block, a.inline-flex, nav a, footer a { min-height: 44px; display: inline-flex; align-items: center; }
    }
    /* Superficies sobrias del sistema Stu_UI: fondo sólido y borde fino, sin degradados ni desenfoques */
    .glass { background: var(--gs-surface); border: 1px solid var(--gs-border); }
    .glass-card { background: var(--gs-surface); border: 1px solid var(--gs-border); }
    /* La cabecera compartida queda fija arriba y no tapa el ancla de las secciones */
    stu-cabecera { display: block; position: sticky; top: 0; z-index: 100; }
    html { scroll-padding-top: 72px; }
    /* Los paneles de la cabecera solo se ven abiertos (.stu-apps-panel declara display:flex después de display:none) */
    stu-cabecera .stu-cabecera-panel:not(.is-open) { display: none; }
    
    ${VISOR_CSS}
    /* Fragmentos remarcados interactivos en la transcripción */
    mark.highlight, mark.highlight-clickable {
      background: #fde047;
      color: #020617;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      cursor: pointer;
      border: 1px solid #facc15;
      transition: background-color 0.15s ease;
      display: inline-block;
    }
    /* Coincidencias de la búsqueda: amarillo con texto casi negro (contraste > 12:1), sin romper el salto de línea */
    mark.gs-mark {
      background: #fde047;
      color: #0f172a;
      font-weight: 700;
      padding: 0 3px;
      border-radius: 4px;
      box-shadow: 0 0 0 1px #facc15;
    }
    /* Las marcas fluyen en línea y parten en varias líneas (móvil): nunca desbordan el ancho de la tarjeta */
    mark.highlight-clickable, mark.gs-mark { display: inline; overflow-wrap: anywhere; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
    mark.highlight-clickable { padding: 0 4px; }
    mark.highlight-clickable:focus-visible, button:focus-visible, [data-ebook-pag]:focus-visible, a:focus-visible, select:focus-visible, input:focus-visible { outline: 3px solid var(--gs-accent); outline-offset: 2px; }
    @media (forced-colors: active) { mark { background: Mark; color: MarkText; forced-color-adjust: none; } }
    mark.highlight-clickable:hover {
      background: #fef08a;
    }

    /* Contenedor PDF.js + Capa de Texto + Resaltados en el PDF */
    #pdf-page-wrapper {
      position: relative;
      margin: 0 auto 32px auto;
      flex-shrink: 0;
      display: inline-block;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
      border-radius: 4px;
      background: #ffffff;
    }
    #pdf-interactive-scroll-container {
      overflow-y: auto !important;
      overflow-x: auto !important;
      max-height: calc(100vh - 68px);
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      cursor: grab;
    }
    #pdf-interactive-scroll-container:active {
      cursor: grabbing;
    }
    /* Móvil: el PDF ocupa ~58% de la altura y la transcripción el resto (antes el PDF quedaba en una franja de 25 px) */
    @media (max-width: 767px) {
      #pdf-interactive-scroll-container {
        flex: 0 0 58%;
        min-height: 0;
        max-height: none;
      }
      #ebook-side-panel {
        flex: 1 1 0;
        min-height: 0;
        overflow: hidden;
      }
    }
    #pdf-canvas {
      display: block;
    }
    #pdf-text-layer {
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      line-height: 1.0;
      z-index: 2;
    }
    #pdf-text-layer > span {
      color: transparent;
      position: absolute;
      white-space: pre;
      cursor: text;
      transform-origin: 0% 0%;
    }
    /* Resaltado fluorescente directo en el PDF original */
    /* Resaltado en el PDF original: relleno amarillo y borde, sin brillos ni animaciones */
    .pdf-highlight-box {
      background: rgba(250, 204, 21, 0.45) !important;
      border: 2px solid #f59e0b !important;
      border-radius: 3px !important;
      cursor: pointer !important;
      z-index: 10 !important;
    }
    .pdf-highlight-box.pdf-radar-focus {
      background: rgba(250, 204, 21, 0.65) !important;
      border: 3px solid #10b981 !important;
    }
    .record-card-flash {
      border-color: #facc15 !important;
      background: rgba(250, 204, 21, 0.08) !important;
    }`;
