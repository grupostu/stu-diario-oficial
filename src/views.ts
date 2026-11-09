import { CRITERIO_CLIENT_JS } from './criterio.js';
import { MASTER_FOOTER_HTML } from './master-footer.js';
import { RESALTADO_CLIENT_JS } from './resaltado.js';
import { LECTURA_CLIENT_JS } from './lectura.js';
import { escapeHtml as esc } from './html.js';
import { THEME_BOOT } from './pagina_base.js';
import { VISOR_CSS, VISOR_HTML, VISOR_JS } from './visor_cliente.js';
import type { Diario } from './diarios.js';
import { BUSQUEDA_CLIENT_JS } from './busqueda_vista.js';

export function renderPortal(stats: { totalDocumentos: number; totalAlertas: number; diarios: Diario[] }): string {
  const diarios = stats.diarios;
  const ultimo = diarios.length ? diarios[diarios.length - 1]! : null;
  const etiquetaDiario = (d: Diario): string => `Tomo ${d.tomo} · N.° ${d.numero} · ${d.fecha.split('-').reverse().join('-')}`;
  return `<!DOCTYPE html>
<html lang="es" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diarios Oficiales de El Salvador · Busca edictos, marcas y leyes por DUI o nombre</title>
  <meta name="description" content="Busca tu DUI, tu nombre o el de tu empresa en los edictos, marcas y leyes del Diario Oficial de El Salvador, lee el PDF original y recibe alertas por correo cuando aparezcas.">
  <!-- Sistema visual Stu_UI (copia local en /stu-ui, sin dependencias externas) -->
  <script>${THEME_BOOT}</script>
  <link rel="stylesheet" href="/stu-ui/tokens.css?v=1">
  <link rel="stylesheet" href="/stu-ui/cabecera/cabecera.css?v=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      // Colores desde los tokens de Stu_UI: claro por defecto, oscuro como modo
      theme: {
        extend: {
          fontFamily: {
            sans: ['var(--gs-font)', 'system-ui', 'sans-serif'],
            mono: ['var(--gs-font-mono)', 'monospace'],
          },
          colors: {
            gs: {
              bg: 'var(--gs-bg)', surface: 'var(--gs-surface)', surface2: 'var(--gs-surface-2)',
              border: 'var(--gs-border)', strong: 'var(--gs-border-strong)',
              text: 'var(--gs-text)', text2: 'var(--gs-text-2)', text3: 'var(--gs-text-3)',
              accent: 'var(--gs-accent)', 'accent-hover': 'var(--gs-accent-hover)', ink: 'var(--gs-accent-ink)',
              danger: 'var(--gs-danger)', warning: 'var(--gs-warning)'
            }
          }
        }
      }
    }
  </script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <!-- PDF.js Oficial (Cloudflare CDN v3.11.174) para Renderizado Hiper-Interactivo + TextLayer -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf_viewer.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    body { font-family: var(--gs-font, system-ui, sans-serif); background: var(--gs-bg); color: var(--gs-text); }
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
    }
  </style>
</head>
<body class="bg-gs-bg text-gs-text min-h-screen flex flex-col antialiased selection:bg-gs-accent selection:text-gs-ink">

  <!-- Cabecera institucional única de Grupo Stu (Stu_UI): menú del sitio + apps + cuenta, 60 px, siempre visible -->
  <stu-cabecera
    platform="diarios"
    platform-name="Diarios Oficiales"
    platform-url="https://diariosoficiales.grupostu.com"
    login-url="https://cuenta.grupostu.com/login"
    >
    <nav slot="nav" aria-label="Secciones de Diarios Oficiales">
      <a href="#buscador" data-tab="dui" aria-current="page">Buscador</a>
      <a href="#marcas" data-tab="marcas">Marcas</a>
      <a href="#edictos" data-tab="recientes">Edictos</a>
      <a href="#decretos" data-tab="leyes">Decretos y acuerdos</a>
      <a href="#hemeroteca" data-tab="hemeroteca">Hemeroteca</a>
      <a href="#guia" data-tab="faq">Guía ciudadana</a>
    </nav>
  </stu-cabecera>

  <!-- Contenedor Principal (márgenes laterales siempre visibles) -->
  <main class="flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full">

    <!-- Aviso de deslinde: no es publicación oficial -->
    <div role="note" class="mb-6 px-4 py-3 rounded-lg border border-gs-border bg-gs-surface text-xs sm:text-sm text-gs-text2 flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
      <span><strong class="text-gs-text">Sitio independiente de consulta. No es el Diario Oficial ni una entidad del Estado.</strong></span>
      <span>Fuente oficial: <a href="https://www.diariooficial.gob.sv/" target="_blank" rel="noopener noreferrer" class="text-gs-accent underline">diariooficial.gob.sv</a> · <a href="https://www.imprentanacional.gob.sv/" target="_blank" rel="noopener noreferrer" class="text-gs-accent underline">Imprenta Nacional</a></span>
    </div>

    <!-- Encabezado de la página -->
    <section class="mb-8 text-left">
      <h1 class="text-2xl sm:text-4xl font-bold text-gs-text tracking-tight leading-tight">Diario Oficial de El Salvador: consulta y notificaciones</h1>
      <p class="mt-3 text-gs-text2 text-sm sm:text-base max-w-3xl leading-relaxed">
        Verifica si tu <strong>DUI</strong> (en números o en letras notariales), <strong>nombre</strong> o <strong>sociedad</strong> figura en edictos de aceptación de herencia, emplazamientos, rebeldías, remates o marcas. Cada resultado enlaza al PDF original, con lo buscado resaltado.
      </p>
      <p class="mt-3 text-xs sm:text-sm text-gs-text2">
        <strong class="text-gs-text">${stats.totalDocumentos}</strong> publicaciones indexadas · <strong class="text-gs-text">${diarios.length}</strong> ${diarios.length === 1 ? 'diario disponible' : 'diarios disponibles'}${ultimo ? ` · último: ${esc(etiquetaDiario(ultimo))} (${ultimo.paginas} págs.)` : ''} · Sin registro de tus búsquedas
      </p>
      <div class="mt-4 flex flex-wrap gap-3">
        ${ultimo ? `<button type="button" onclick="openEbookViewer(1, '', '${esc(ultimo.id)}')" class="bg-gs-surface hover:bg-gs-surface2 border border-gs-border text-gs-text font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
          <i class="fa-solid fa-book-open-reader"></i> Abrir el diario más reciente
        </button>` : ''}
        <button type="button" onclick="openModalAlert()" class="bg-gs-accent hover:bg-gs-accent-hover text-gs-ink font-bold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
          <i class="fa-solid fa-bell"></i> Vigilancia por DUI
        </button>
      </div>
    </section>


    <!-- ========================================================================= -->
    <!-- TAB 1: BUSCADOR GENERAL Y DUI -->
    <!-- ========================================================================= -->
    <div id="tab-content-dui" class="space-y-6">
      <div class="glass-card p-5 sm:p-7 rounded-xl border border-gs-border">
        <form onsubmit="searchDiario(event)" novalidate class="space-y-4">
          <div>
            <div class="relative">
              <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gs-text3"></i>
              <input type="text" id="query-input" maxlength="200" aria-label="Buscar en el Diario Oficial" enterkeyhint="search" autocomplete="off" aria-describedby="ayuda-busqueda" placeholder="Ingresa DUI (ej. 00000000-0, 000000000 o en letras), Nombre Completo o Causante..."
                oninput="handleDuiInputPreview(this.value)"
                class="w-full bg-gs-bg border border-gs-border focus:border-gs-accent rounded-2xl pl-11 pr-4 py-4 text-gs-text text-sm outline-none font-mono">
            </div>

            <p id="ayuda-busqueda" class="mt-2 text-[11px] sm:text-xs text-gs-text2 leading-relaxed text-left">Puedes buscar por DUI, por nombre, por número de decreto (por ejemplo «Decreto No. 690», «decreto 690» o «D. 690») o por cualquier palabra del texto. Para buscar una frase exacta, escríbela entre comillas, por ejemplo «&quot;amnistía fiscal&quot;». No importan las mayúsculas ni las tildes, y el máximo es de 200 caracteres.</p>


            <!-- Badge dinámico de detección y normalización de DUI -->
            <div id="dui-preview-badge" class="hidden mt-3 p-3 rounded-xl bg-gs-accent/10 border border-gs-border text-xs font-mono text-gs-accent flex flex-wrap items-center justify-between gap-2">
              <span id="dui-preview-text"></span>
              <span id="dui-preview-words" class="text-[11px] text-gs-warning font-bold"></span>
            </div>
          </div>
          
          <div class="flex flex-col lg:flex-row gap-3">
            <select id="category-filter" aria-label="Filtrar por sección del Diario Oficial" class="flex-1 min-w-0 bg-gs-bg border border-gs-border rounded-2xl px-4 py-3 text-gs-text2 text-xs sm:text-sm outline-none font-medium">
              <option value="">Todas las Secciones del Diario Oficial</option>
              <option value="EDICTO_JUDICIAL">Edictos Judiciales y Notariales (Herencias, Emplazamientos, Rebeldías)</option>
              <option value="REGISTRO_MARCA">Registro de Marcas y Patentes (CNR)</option>
              <option value="DECRETO_LEGISLATIVO">Decretos de la Asamblea Legislativa</option>
              <option value="SUBASTA_EMBARGO">Subastas, Embargos y Remates Públicos</option>
              <option value="ACUERDO_EJECUTIVO">Acuerdos Ejecutivos y Reglamentos</option>
              <option value="BALANCE_FINANCIERO">Balances y Estados Financieros</option>
              <option value="GENERAL">Otras Publicaciones Oficiales</option>
            </select>

            <div class="flex items-center gap-2 bg-gs-bg px-4 py-3 rounded-2xl border border-gs-border">
              <input type="checkbox" id="force-dui-check" class="w-5 h-5 rounded text-gs-accent focus:ring-0 bg-gs-surface border-gs-border">
              <label for="force-dui-check" class="text-xs text-gs-text2 select-none cursor-pointer">Filtrar exclusivamente por DUI</label>
            </div>

            <button type="submit" id="btn-search" class="bg-gs-accent hover:bg-gs-accent-hover text-gs-ink font-semibold px-8 py-3.5 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shrink-0">
              <i class="fa-solid fa-bolt"></i> Consultar Archivo Oficial
            </button>
          </div>
        </form>
      </div>

      <!-- Resultados Dinámicos -->
      <div id="search-aviso" role="alert" class="hidden mb-4 p-3 rounded-xl bg-gs-surface2 border border-gs-border text-xs text-gs-warning text-left"></div>
      <div id="search-resumen" role="status" aria-live="polite" aria-atomic="true" class="hidden mb-4 p-4 rounded-2xl bg-gs-surface border border-gs-border text-left outline-none"></div>
      <div id="results-container" class="space-y-4" aria-live="polite" aria-relevant="additions">
        <!-- Renderizado por JS -->
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- TAB 2: BUSCADOR DE MARCAS REGISTRADAS (CNR) -->
    <!-- ========================================================================= -->
    <div id="tab-content-marcas" class="hidden space-y-6">
      <div class="glass-card p-5 sm:p-7 rounded-xl border border-gs-border">
        <div class="flex items-center gap-3 mb-4">
          <img src="/assets/graphics/icono-registro-marca.svg" alt="Marcas CNR" class="w-11 h-11 rounded-xl">
          <div>
            <h3 class="text-lg font-bold text-gs-text">Marcas y signos distintivos</h3>
            <p class="text-xs text-gs-text2">Solo se muestran avisos de marcas que aparezcan en los diarios cargados. Si un diario no trae avisos de marcas, no se muestra nada.</p>
          </div>
        </div>

        <form onsubmit="searchMarcas(event)" class="space-y-4">
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
              <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gs-text3"></i>
              <input type="text" id="marca-query" aria-label="Buscar por denominación de marca o titular" placeholder="Buscar por denominación de marca o titular…"
                class="w-full bg-gs-bg border border-gs-border focus:border-gs-accent rounded-2xl pl-11 pr-4 py-3.5 text-gs-text text-sm outline-none">
            </div>
            <button type="submit" class="bg-gs-accent hover:bg-gs-accent-hover text-gs-ink font-semibold px-6 py-3.5 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2">
              <i class="fa-solid fa-magnifying-glass"></i> Buscar marcas
            </button>
          </div>
        </form>
      </div>

      <div id="marcas-results-container" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Renderizado por JS -->
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- TAB 3: ÚLTIMOS EDICTOS JUDICIALES -->
    <!-- ========================================================================= -->
    <div id="tab-content-recientes" class="hidden space-y-4">
      <div class="glass-card p-6 rounded-xl border border-gs-border flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="/assets/graphics/icono-edicto-judicial.svg" alt="Edictos" class="w-11 h-11 rounded-xl">
          <div>
            <h3 class="text-base sm:text-lg font-bold text-gs-text flex items-center gap-2">
              Edictos judiciales y notariales del último diario
            </h3>
            <p class="text-xs text-gs-text2">Publicaciones recientes con clasificación jurídica automática, número exacto de página y chips de DUI interactivos.</p>
          </div>
        </div>
        <button onclick="loadRecentEdictos()" class="text-xs text-gs-accent font-bold hover:underline flex items-center gap-1">
          <i class="fa-solid fa-rotate-right"></i> Recargar
        </button>
      </div>
      <div id="edictos-recientes-container" class="space-y-4">
        <!-- Renderizado por JS -->
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- TAB 4: LEYES Y DECRETOS OFICIALES -->
    <!-- ========================================================================= -->
    <div id="tab-content-leyes" class="hidden space-y-4">
      <div class="glass-card p-6 rounded-xl border border-gs-border flex items-center gap-3">
        <img src="/assets/graphics/icono-decreto-acuerdo.svg" alt="Decretos" class="w-11 h-11 rounded-xl">
        <div>
          <h3 class="text-base sm:text-lg font-bold text-gs-text flex items-center gap-2">
            Decretos legislativos del último diario
          </h3>
          <p class="text-xs text-gs-text2 mt-0.5">Solo se listan decretos cuyo texto se pudo leer en el PDF.</p>
        </div>
      </div>
      <div id="leyes-recientes-container" class="space-y-4">
        <!-- Renderizado por JS -->
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- TAB 5: HEMEROTECA -->
    <!-- ========================================================================= -->
    <div id="tab-content-hemeroteca" class="hidden space-y-6 text-left">
      <div class="glass-card p-6 sm:p-8 rounded-xl border border-gs-border space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-gs-border pb-4">
          <div>
            <h3 class="text-xl font-semibold text-gs-text flex items-center gap-2.5">
              <i class="fa-solid fa-book-journal-whills text-gs-warning"></i>
              Hemeroteca de diarios
            </h3>
            <p class="text-xs text-gs-text2 mt-1">Diarios disponibles para consulta.</p>
          </div>
        </div>

        <!-- Diarios realmente disponibles (se leen del catálogo del servidor, nunca se escriben a mano) -->
        <div>
          <h4 class="text-sm font-bold text-gs-text mb-3 flex items-center gap-2">
            <i class="fa-solid fa-book-journal-whills text-gs-warning"></i> Diarios disponibles para consulta
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            ${diarios.length ? diarios.slice().reverse().map((d) => `
            <button type="button" onclick="openEbookViewer(1, '', '${esc(d.id)}')" class="text-left bg-gs-bg p-4 rounded-2xl border border-gs-border hover:border-gs-accent transition-all">
              <span class="text-sm font-bold text-gs-text block">Tomo ${esc(d.tomo)} · N.° ${esc(d.numero)}</span>
              <span class="text-[11px] font-mono text-gs-warning block mt-0.5">${esc(d.fecha.split('-').reverse().join('-'))}</span>
              <span class="text-[11px] text-gs-text2 font-mono block mt-1">${esc(d.paginas)} páginas · Abrir diario</span>
            </button>`).join('') : '<p class="text-xs text-gs-text2">Aún no hay diarios cargados.</p>'}
          </div>
          <p class="text-[11px] text-gs-text3 mt-3">Cada diario se incorpora a partir de su PDF original. Solo se listan los diarios que realmente están cargados.</p>
        </div>

        <!-- Catálogo Visual de Clasificaciones Jurídicas -->
        <div>
          <h4 class="text-sm font-bold text-gs-text mb-3 flex items-center gap-2">
            <i class="fa-solid fa-layer-group text-gs-accent"></i> Clasificación automática (orientativa)
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <img src="/assets/graphics/card-aceptacion-herencia.webp" alt="Aceptación de Herencia" class="w-full rounded-2xl border border-gs-border">
            <img src="/assets/graphics/card-edicto-judicial.webp" alt="Edicto Judicial" class="w-full rounded-2xl border border-gs-border">
            <img src="/assets/graphics/card-declaratoria-rebeldia.webp" alt="Declaratoria de Rebeldía" class="w-full rounded-2xl border border-gs-border">
            <img src="/assets/graphics/card-titulo-supletorio.webp" alt="Título Supletorio" class="w-full rounded-2xl border border-gs-border">
            <img src="/assets/graphics/card-subasta-publica.webp" alt="Subasta Pública" class="w-full rounded-2xl border border-gs-border">
            <img src="/assets/graphics/card-aviso-sociedad.webp" alt="Aviso de Sociedad" class="w-full rounded-2xl border border-gs-border">
            <img src="/assets/graphics/card-decreto-acuerdo.webp" alt="Decreto o Acuerdo" class="w-full rounded-2xl border border-gs-border">
            <img src="/assets/graphics/card-propiedad-intelectual.webp" alt="Propiedad Intelectual" class="w-full rounded-2xl border border-gs-border">
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- TAB 6: GUÍA CIUDADANA Y PREGUNTAS CLAVE -->
    <!-- ========================================================================= -->
    <div id="tab-content-faq" class="hidden space-y-4 text-left">
      <div class="glass-card p-6 sm:p-8 rounded-xl border border-gs-border">
        <h3 class="text-xl font-bold text-gs-text mb-2 flex items-center gap-2">
          <i class="fa-solid fa-scale-balanced text-gs-accent"></i> ¿Qué preguntas debe responder la mayor plataforma de Diarios Oficiales?
        </h3>
        <p class="text-xs sm:text-sm text-gs-text2 leading-relaxed mb-6">
          Los Diarios Oficiales contienen decisiones que afectan directamente la libertad, el patrimonio, las herencias y los negocios de los ciudadanos de El Salvador. Aquí respondemos las dudas jurídicas y prácticas más críticas:
        </p>

        <div class="space-y-4">
          <div class="bg-gs-bg p-5 rounded-2xl border border-gs-border">
            <h4 class="text-sm font-bold text-gs-text mb-1.5 flex items-center gap-2">
              <span class="text-gs-accent">01.</span> ¿Qué consecuencias legales tiene que mi DUI aparezca en un edicto judicial?
            </h4>
            <p class="text-xs text-gs-text2 leading-relaxed">
              En El Salvador, cuando un juzgado civil, mercantil o de sentencia no encuentra a una persona demandada o imputada, la ley ordena emplazarla por <strong>edicto en el Diario Oficial</strong>. Si no te presentas con tu abogado en el plazo concedido (usualmente 10 días hábiles), el tribunal te declara formalmente en <strong>calidad de rebeldía</strong> y dicta sentencia condenatoria o embargo ejecutivo sin que hayas ejercido tu derecho de defensa.
            </p>
          </div>

          <div class="bg-gs-bg p-5 rounded-2xl border border-gs-border">
            <h4 class="text-sm font-bold text-gs-text mb-1.5 flex items-center gap-2">
              <span class="text-gs-accent">02.</span> ¿Cómo reclamar o verificar una herencia si vi a un familiar en un edicto?
            </h4>
            <p class="text-xs text-gs-text2 leading-relaxed">
              Los edictos de aceptación de herencia (publicados por juzgados civiles y por notarios) confieren la <em>administración y representación definitiva de la sucesión</em> a los herederos declarados. Si consideras que tienes igual o mejor derecho hereditario, el edicto publicado en el Diario Oficial es la prueba legal para personarte ante el juez o notario.
            </p>
          </div>

          <div class="bg-gs-bg p-5 rounded-2xl border border-gs-border">
            <h4 class="text-sm font-bold text-gs-text mb-1.5 flex items-center gap-2">
              <span class="text-gs-warning">03.</span> ¿Cómo funciona la sincronización entre la transcripción y el PDF original?
            </h4>
            <p class="text-xs text-gs-text2 leading-relaxed">
              Nuestro visor utiliza <strong>PDF.js con capa vectorial de texto</strong>. Cuando buscas un DUI (incluso si el juez lo redactó en letras como <em>CERO CERO TRES CINCO SEIS DOS SIETE CUATRO - DOS</em>), el sistema remarca automáticamente los fragmentos en la columna derecha y dibuja resaltados fluorescentes sobre el PDF a la izquierda. Al hacer clic en cualquier fragmento remarcado, el PDF hace scroll y zoom directo hacia la línea exacta con un destello de radar.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Marco Legal, Términos y Condiciones y Descargo de Responsabilidad de Grupo Stu, S.A.S. -->
    <div class="mt-8 p-6 rounded-2xl border border-gs-border bg-gs-bg text-xs text-gs-text2 leading-relaxed text-left space-y-3">
      <div class="flex items-center justify-between flex-wrap gap-2 border-b border-gs-border pb-2.5">
        <div class="flex items-center gap-2.5 text-gs-text font-bold">
          <span class="w-8 h-8 rounded-lg bg-gs-accent/10 border border-gs-border flex items-center justify-center text-gs-accent">
            <i class="fa-solid fa-scale-balanced"></i>
          </span>
          <span>Términos de Uso, Naturaleza Informativa y Descargo Legal de Responsabilidad — Grupo Stu, S.A.S.</span>
        </div>
        <span class="text-[10px] font-mono px-2.5 py-1 rounded bg-gs-surface border border-gs-border text-gs-text2">Uso informativo</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
        <div class="bg-gs-surface p-3.5 rounded-xl border border-gs-border">
          <strong class="text-gs-text block mb-1">1. Información Pública Oficiosa (LAIP):</strong>
          De conformidad con los Arts. 10 y 11 de la <em>Ley de Acceso a la Información Pública</em> de El Salvador, las publicaciones del Diario Oficial son información de libre acceso y dominio público. Este portal facilita su búsqueda tecnológica.
        </div>
        <div class="bg-gs-surface p-3.5 rounded-xl border border-gs-border">
          <strong class="text-gs-text block mb-1">2. No Sustitución ni Carácter Certificante:</strong>
          <strong>Grupo Stu, S.A.S.</strong> es una entidad privada e independiente; no representa ni sustituye a la Imprenta Nacional (<code>diariooficial.gob.sv</code>) ni emite certificaciones, constancias oficiales o copias fieles con valor probatorio judicial.
        </div>
        <div class="bg-gs-surface p-3.5 rounded-xl border border-gs-border">
          <strong class="text-gs-warning block mb-1">3. Limitación Total de Responsabilidad:</strong>
          Las transcripciones se extraen automáticamente del texto del PDF y se ofrecen «tal cual» con fines orientativos. <strong>Grupo Stu, S.A.S. no es responsable de la exactitud de la información contenida ni del uso, interpretación o decisiones tomadas por el usuario.</strong>
        </div>
      </div>
    </div>
  </main>

  ${VISOR_HTML}

  <!-- Modal para Suscripción de Alertas Preventivas -->
  <div id="modal-alert" class="fixed inset-0 bg-gs-bg hidden items-center justify-center p-4 z-50">
    <div class="glass-card max-w-md w-full p-6 sm:p-8 rounded-xl border border-gs-border text-left">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gs-text flex items-center gap-2">
          <i class="fa-solid fa-bell text-gs-accent"></i> Alerta Preventiva por DUI
        </h3>
        <button type="button" aria-label="Cerrar" onclick="closeModalAlert()" class="text-gs-text2 hover:text-gs-text text-lg"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <p class="text-xs text-gs-text2 mb-6 leading-relaxed">
        Nuestro motor revisa cada nueva publicación del Diario Oficial. Si se detecta tu número de DUI, nombre o sociedad en un edicto judicial, orden de captura, embargo o registro de marca, te enviaremos una notificación inmediata.
      </p>
      <form onsubmit="submitAlert(event)" novalidate class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-gs-text2 mb-1">DUI o Nombre a Monitorear</label>
          <input type="text" id="alert-criterion" aria-label="DUI o nombre a vigilar" placeholder="ej. 00000000-0 o Nombre Completo" required
            class="w-full bg-gs-bg border border-gs-border rounded-xl px-4 py-3 text-gs-text text-sm outline-none font-mono focus:border-gs-accent">
        </div>
        <div>
          <label class="block text-xs font-bold text-gs-text2 mb-1">Correo Electrónico para Alertas</label>
          <input type="email" id="alert-email" aria-label="Correo para recibir alertas" placeholder="correo@ejemplo.com" required
            class="w-full bg-gs-bg border border-gs-border rounded-xl px-4 py-3 text-gs-text text-sm outline-none focus:border-gs-accent">
        </div>
        <div>
          <label class="block text-xs font-bold text-gs-text2 mb-1">WhatsApp de Urgencia (Opcional)</label>
          <input type="tel" id="alert-phone" placeholder="+503 7000-0000"
            class="w-full bg-gs-bg border border-gs-border rounded-xl px-4 py-3 text-gs-text text-sm outline-none focus:border-gs-accent">
        </div>
        <div class="rounded-xl border border-gs-border bg-gs-bg p-3 text-[11px] leading-relaxed text-gs-text2">
          <p><strong class="text-gs-text">Aviso de privacidad.</strong> Grupo Stu, S.A.S. usa tu correo, tu WhatsApp (si lo das) y el DUI o nombre que escribas solo para enviarte alertas cuando aparezcan en el Diario Oficial. Los guardamos mientras la alerta siga activa y puedes pedir la baja y el borrado en cualquier momento. No los vendemos ni los usamos para otra cosa. <a href="/privacidad" target="_blank" rel="noopener" class="text-gs-accent underline">Leer el aviso completo</a>.</p>
        </div>
        <label class="flex items-start gap-2 text-xs text-gs-text cursor-pointer">
          <input type="checkbox" id="alert-consent" required class="mt-0.5 h-4 w-4 accent-emerald-500">
          <span>He leído el aviso de privacidad y autorizo a Grupo Stu, S.A.S. a tratar estos datos para enviarme las alertas.</span>
        </label>
        <p id="alert-msg" role="status" class="hidden text-xs rounded-xl px-3 py-2"></p>
        <button type="submit" class="w-full bg-gs-accent hover:bg-gs-accent-hover text-gs-ink font-semibold py-3.5 rounded-xl text-sm transition-all">
          Guardar Alerta y Proteger mi Identidad
        </button>
      </form>
    </div>
  </div>

  ${MASTER_FOOTER_HTML}

  <script type="module" src="/stu-ui/cabecera/cabecera.js?v=1"></script>
  <script>
    // Menú de la cabecera compartida: delegado en el documento porque el componente vuelve a pintar su navegación
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('stu-cabecera a[data-tab]') : null;
      if (!a) return;
      e.preventDefault();
      switchTab(a.getAttribute('data-tab'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const DIGIT_WORDS = ['CERO', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];

    function duiToNotarialWordsJS(dui) {
      const clean = String(dui || '').replace(/\\D/g, '');
      if (clean.length !== 9) return '';
      const p1 = clean.slice(0, 8).split('').map(d => DIGIT_WORDS[parseInt(d, 10)]).join(' ');
      const p2 = DIGIT_WORDS[parseInt(clean[8], 10)];
      return p1 + ' - ' + p2;
    }

    function classifyLegalRecordJS(rec) {
      if (rec.clasificacionJuridica) return rec.clasificacionJuridica;
      const t = ((rec.titular || '') + ' ' + (rec.contenido || '')).toLowerCase();
      if (t.includes('herencia') || t.includes('heredero') || t.includes('sucesión') || t.includes('causante')) return 'Aceptación de Herencia';
      if (t.includes('rebeldía') || t.includes('ausente') || t.includes('captura')) return 'Declaratoria de Rebeldía';
      if (t.includes('título supletorio') || t.includes('titulo supletorio') || t.includes('titulación')) return 'Título Supletorio';
      if (t.includes('subasta') || t.includes('remate') || t.includes('embargo')) return 'Subasta Pública';
      if (t.includes('sociedad') || t.includes('balance') || t.includes('marca') || rec.categoria === 'REGISTRO_MARCA') return 'Aviso de Sociedad';
      if (t.includes('decreto') || t.includes('acuerdo') || rec.categoria === 'DECRETO_LEGISLATIVO') return 'Decreto/Acuerdo';
      return 'Edicto Judicial';
    }

    function getLegalClassificationBadge(label) {
      const map = {
        'Aceptación de Herencia': { icon: '/assets/graphics/icono-aceptacion-herencia.svg', cls: 'bg-gs-surface2 text-gs-accent border-gs-border' },
        'Declaratoria de Rebeldía': { icon: '/assets/graphics/icono-declaratoria-rebeldia.svg', cls: 'bg-gs-surface2 text-gs-danger border-gs-border' },
        'Título Supletorio': { icon: '/assets/graphics/icono-titulo-supletorio.svg', cls: 'bg-gs-surface2 text-gs-accent border-gs-border' },
        'Subasta Pública': { icon: '/assets/graphics/icono-subasta-publica.svg', cls: 'bg-gs-surface2 text-gs-warning border-gs-border' },
        'Aviso de Sociedad': { icon: '/assets/graphics/icono-aviso-sociedad.svg', cls: 'bg-gs-surface2 text-gs-accent border-gs-border' },
        'Decreto/Acuerdo': { icon: '/assets/graphics/icono-decreto-acuerdo.svg', cls: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40' },
        'Edicto Judicial': { icon: '/assets/graphics/icono-edicto-judicial.svg', cls: 'bg-gs-surface2 text-gs-accent border-gs-border' }
      };
      const st = map[label] || map['Edicto Judicial'];
      return \`<span class="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border \${st.cls}">
        <img src="\${st.icon}" alt="" class="w-4 h-4"> \${escapeHtmlText(label)}
      </span>\`;
    }

    function renderDuiChipsHtml(duis, pagina) {
      if (!duis || duis.length === 0) return '';
      return '<div class="mt-3 pt-2.5 border-t border-gs-border flex flex-wrap items-center gap-2">' +
        '<span class="text-[11px] font-mono text-gs-warning font-bold flex items-center gap-1"><i class="fa-solid fa-fingerprint"></i> DUIs Identificados:</span>' +
        duis.map(dui => {
          const words = duiToNotarialWordsJS(dui);
          return \`<button type="button" data-ebook-pag="\${escapeHtmlText(parseInt(pagina, 10) || 1)}" data-term="\${escapeHtmlText(dui)}" title="Clic para abrir el Visor Ebook en Pág. \${escapeHtmlText(parseInt(pagina, 10) || 1)} y localizar en el PDF: \${escapeHtmlText(words)}"
            class="group px-2.5 py-1 rounded-lg bg-gs-surface2 hover:bg-gs-warning text-gs-warning hover:text-gs-ink border border-gs-border text-xs font-mono font-semibold transition-all flex items-center gap-1.5 shadow-sm">
            <span>\${escapeHtmlText(dui)}</span>
            <span class="text-[10px] text-gs-warning group-hover:text-gs-ink font-normal hidden sm:inline">(\${escapeHtmlText(words.split(' ').slice(0, 3).join(' '))}...)</span>
            <i class="fa-solid fa-crosshairs text-[10px]"></i>
          </button>\`;
        }).join('') +
      '</div>';
    }

    // Misma validación que el servidor (src/criterio.ts): DUI completo y válido, o nombre sin etiquetas ni símbolos.
    ${CRITERIO_CLIENT_JS}

    // Núcleo compartido con el servidor: plegado de tildes, mapa de posiciones, coincidencias y resaltado seguro.
    ${RESALTADO_CLIENT_JS}

    // Presentación de resultados por campo y párrafo.
    ${BUSQUEDA_CLIENT_JS}

    function escapeHtmlText(t) {
      return String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function openModalAlert() {
      document.getElementById('modal-alert').classList.remove('hidden');
      document.getElementById('modal-alert').classList.add('flex');
    }

    function closeModalAlert() {
      document.getElementById('modal-alert').classList.add('hidden');
      document.getElementById('modal-alert').classList.remove('flex');
    }

    // Previsualizador dinámico de DUI mientras el usuario escribe
    function handleDuiInputPreview(val) {
      const badge = document.getElementById('dui-preview-badge');
      const text = document.getElementById('dui-preview-text');
      const wordsEl = document.getElementById('dui-preview-words');
      const clean = val.replace(/[^0-9]/g, '');
      // Solo es un DUI completo con 9 dígitos, o con el verificador separado ("356274-2")
      const separado = /^[0-9]{1,8}[ -][0-9]$/.test(val.trim());

      if (clean.length === 9 || (separado && clean.length >= 7)) {
        const padded = clean.padStart(9, '0');
        const formatted = padded.slice(0, 8) + '-' + padded.slice(8);
        text.innerHTML = '<i class="fa-solid fa-fingerprint text-gs-accent mr-1.5"></i> DUI: <strong class="text-gs-text">' + formatted + '</strong>';
        wordsEl.innerText = 'En letras: ' + duiToNotarialWordsJS(formatted);
        badge.classList.remove('hidden');
      } else if (clean.length >= 6 && clean.length < 9 && /^[0-9 -]+$/.test(val.trim())) {
        text.innerHTML = '<i class="fa-solid fa-circle-info text-gs-warning mr-1.5"></i> DUI incompleto: llevas ' + clean.length + ' de 9 dígitos';
        wordsEl.innerText = '';
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    function quickSearchDemo(term) {
      const input = document.getElementById('query-input');
      input.value = term;
      handleDuiInputPreview(term);
      searchDiario();
    }

    ${LECTURA_CLIENT_JS}

    ${VISOR_JS}

    // Cambio de pestañas
    function switchTab(tabId) {
      const tabs = ['dui', 'marcas', 'recientes', 'leyes', 'hemeroteca', 'faq'];
      tabs.forEach(t => {
        const content = document.getElementById('tab-content-' + t);
        if (!content) return;
        content.classList.toggle('hidden', t !== tabId);
      });
      // El menú de la cabecera compartida marca la sección activa (aria-current)
      document.querySelectorAll('stu-cabecera a[data-tab]').forEach(a => {
        if (a.getAttribute('data-tab') === tabId) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });

      if (tabId === 'marcas' && document.getElementById('marcas-results-container').children.length === 0) {
        searchMarcas();
      } else if (tabId === 'recientes' && document.getElementById('edictos-recientes-container').children.length === 0) {
        loadRecentEdictos();
      } else if (tabId === 'leyes' && document.getElementById('leyes-recientes-container').children.length === 0) {
        loadRecentLeyes();
      }
    }

    // Búsqueda General y DUI: resultados por campo y párrafo (ver src/busqueda_vista.ts)
    // Cada consulta lleva un número de solicitud y su propio AbortController: una respuesta vieja jamás pisa a la nueva.
    let gsSolicitudId = 0;
    let gsAbortar = null;
    let gsPaginaActual = 1;

    function gsMostrarFallo(contenedor, titulo, detalle, conReintento) {
      contenedor.innerHTML = '<div role="alert" class="glass-card p-6 rounded-xl text-center border border-gs-border">' +
        '<h4 class="text-base font-bold text-gs-text">' + escapeHtmlText(titulo) + '</h4>' +
        '<p class="text-xs sm:text-sm text-gs-text2 mt-1 max-w-md mx-auto">' + escapeHtmlText(detalle) + '</p>' +
        (conReintento ? '<button type="button" data-gs-reintentar="1" class="mt-3 px-4 py-2 rounded-xl bg-gs-surface border border-gs-border text-gs-accent font-bold text-xs">Reintentar</button>' : '') +
        '</div>';
    }

    // Dirección compartible: ?q=...&categoria=...&forceDui=1&pagina=n
    function gsActualizarUrl(q, cat, forceDui, pag, reemplazar) {
      try {
        const p = new URLSearchParams();
        if (q) p.set('q', q);
        if (cat) p.set('categoria', cat);
        if (forceDui) p.set('forceDui', '1');
        if (pag > 1) p.set('pagina', String(pag));
        const destino = location.pathname + (p.toString() ? '?' + p.toString() : '');
        if (destino === location.pathname + location.search) return;
        if (reemplazar) history.replaceState(null, '', destino);
        else history.pushState(null, '', destino);
      } catch (_) { /* historial no disponible: la búsqueda funciona igual */ }
    }

    function searchDiario(e, pagina, sinHistorial) {
      if (e && e.preventDefault) e.preventDefault();
      const pag = parseInt(pagina, 10) > 1 ? Math.min(parseInt(pagina, 10), 1000) : 1;
      const q = document.getElementById('query-input').value.trim();
      const cat = document.getElementById('category-filter').value;
      const forceDui = document.getElementById('force-dui-check').checked;
      const resContainer = document.getElementById('results-container');
      const resumenEl = document.getElementById('search-resumen');
      const btn = document.getElementById('btn-search');
      const avisoEl = document.getElementById('search-aviso');
      const idSolicitud = ++gsSolicitudId;
      if (gsAbortar) { try { gsAbortar.abort(); } catch (_) { /* ya terminó */ } gsAbortar = null; }
      avisoEl.classList.add('hidden');
      resumenEl.classList.add('hidden');
      resumenEl.innerHTML = '';
      gsActivarAcciones(resContainer, function (n) { searchDiario(null, n > 0 ? n : gsPaginaActual); });

      const restaurarBoton = function () {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Consultar Archivo Oficial';
        resContainer.removeAttribute('aria-busy');
      };

      if (q.length === 0) {
        restaurarBoton();
        avisoEl.innerText = 'Escribe un DUI, un nombre, un número de decreto o una frase entre comillas para buscar en el archivo.';
        avisoEl.classList.remove('hidden');
        resContainer.innerHTML = '';
        return;
      }
      gsPaginaActual = pag;
      if (!sinHistorial) gsActualizarUrl(q, cat, forceDui, pag, false);

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Consultando Archivo...';
      resContainer.setAttribute('aria-busy', 'true');
      resContainer.innerHTML = '<div class="glass-card p-10 text-center text-gs-text2"><i class="fa-solid fa-spinner fa-spin text-3xl text-gs-accent"></i><p class="mt-3 text-sm font-mono">Buscando en los títulos, números de decreto, órganos emisores y en cada párrafo de las publicaciones oficiales...</p></div>';

      const url = '/api/v1/search?v=2&q=' + encodeURIComponent(q) +
                  (cat ? '&categoria=' + encodeURIComponent(cat) : '') +
                  (forceDui ? '&forceDui=1' : '') +
                  (pag > 1 ? '&pagina=' + pag : '');
      const control = typeof AbortController === 'function' ? new AbortController() : null;
      gsAbortar = control;

      fetch(url, control ? { signal: control.signal, headers: { Accept: 'application/json' } } : { headers: { Accept: 'application/json' } })
        .then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (cuerpo) { return { status: r.status, ok: r.ok, data: cuerpo || {} }; });
        })
        .then(function (res) {
          if (idSolicitud !== gsSolicitudId) return; // llegó tarde: ya hay una consulta más reciente
          restaurarBoton();
          const data = res.data;
          if (res.status === 429) {
            gsMostrarFallo(resContainer, 'Demasiadas consultas seguidas', 'Espera unos segundos antes de volver a buscar.', true);
            return;
          }
          if (res.status === 400) {
            resContainer.innerHTML = '<div role="alert" class="glass-card p-6 rounded-xl text-center border border-gs-border"><i class="fa-solid fa-triangle-exclamation text-3xl text-gs-warning mb-2"></i><h4 class="text-base font-bold text-gs-text">Revisa lo que escribiste</h4><p class="text-xs sm:text-sm text-gs-text2 mt-1 max-w-md mx-auto">' + escapeHtmlText(data.aviso || 'La consulta no es válida.') + '</p></div>';
            return;
          }
          if (!res.ok || !Array.isArray(data.resultados)) {
            gsMostrarFallo(resContainer, 'El archivo no pudo responder', 'Hubo un problema en el servidor. Inténtalo de nuevo en unos segundos.', true);
            return;
          }
          if (data.aviso) {
            avisoEl.innerText = data.aviso;
            avisoEl.classList.remove('hidden');
          }
          // Entrada inválida sin resultados: nunca se dice «sin publicaciones». Con resultados (p. ej. DUI con verificador dudoso) se muestran junto al aviso.
          if (data.entradaInvalida && !(data.total > 0)) {
            resContainer.innerHTML = '<div role="alert" class="glass-card p-6 rounded-xl text-center border border-gs-border"><i class="fa-solid fa-triangle-exclamation text-3xl text-gs-warning mb-2"></i><h4 class="text-base font-bold text-gs-text">Revisa lo que escribiste</h4><p class="text-xs sm:text-sm text-gs-text2 mt-1 max-w-md mx-auto">' + escapeHtmlText(data.aviso || 'La consulta no es válida.') + ' Todavía no se hizo una consulta confiable, así que no podemos decir si aparece o no en el archivo.</p></div>';
            return;
          }

          gsConsultaActual = String(data.duiNormalized || q).replace(/["“”«»]/g, '');

          if (data.resultados.length === 0) {
            const fuera = data.total > 0 && pag > data.totalPaginas;
            resumenEl.innerHTML = '<p class="text-xs sm:text-sm text-gs-text">' + (fuera
              ? 'La página que pediste no existe: esta búsqueda solo tiene ' + escapeHtmlText(data.totalPaginas) + ' páginas de resultados.'
              : 'No se encontraron publicaciones que contengan todo lo que buscaste.') + '</p>';
            resumenEl.classList.remove('hidden');
            resContainer.innerHTML = '<div class="glass-card p-8 sm:p-10 rounded-xl text-center text-gs-text2 border border-gs-border">' +
              '<i class="fa-regular fa-circle-check text-4xl text-gs-accent mb-3"></i>' +
              '<h4 class="text-base sm:text-lg font-bold text-gs-text">Sin publicaciones oficiales encontradas</h4>' +
              '<p class="text-xs sm:text-sm text-gs-text2 mt-1 max-w-md mx-auto">El criterio «<strong>' + escapeHtmlText(q) + '</strong>» no aparece en los títulos, números de decreto, órganos emisores ni en el texto de las publicaciones de este tomo. Prueba con menos palabras, revisa la ortografía (no importan las tildes ni las mayúsculas) o quita el filtro de sección.</p>' +
              '<div class="mt-5"><button type="button" onclick="openModalAlert()" class="px-5 py-2.5 rounded-xl bg-gs-surface border border-gs-border text-gs-accent font-bold text-xs hover:bg-gs-surface2">Crear una alerta para este criterio</button></div></div>';
            return;
          }

          resumenEl.innerHTML = gsHtmlResumen(data);
          resumenEl.classList.remove('hidden');
          resContainer.innerHTML = gsRenderResultados(data);
          if (pag > 1) {
            resumenEl.setAttribute('tabindex', '-1');
            resumenEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            resumenEl.focus({ preventScroll: true });
          }
        })
        .catch(function (err) {
          if (idSolicitud !== gsSolicitudId) return;
          if (err && err.name === 'AbortError') return;
          restaurarBoton();
          gsMostrarFallo(resContainer, 'No pudimos conectar con el archivo oficial', 'Revisa tu conexión a internet y vuelve a intentarlo.', true);
        });
    }

    // Marcas: solo avisos de marcas que existan en los diarios cargados (nunca datos de ejemplo)
    function searchMarcas(e) {
      if (e) e.preventDefault();
      const q = document.getElementById('marca-query')?.value?.trim() || '';
      const container = document.getElementById('marcas-results-container');
      container.innerHTML = '<div class="col-span-2 p-8 text-center text-gs-text2"><i class="fa-solid fa-spinner fa-spin text-2xl text-gs-accent"></i></div>';
      fetch('/api/v1/marcas?q=' + encodeURIComponent(q))
        .then(r => { if (!r.ok) throw new Error('http'); return r.json(); })
        .then(data => {
          if (!data.marcas || data.marcas.length === 0) {
            container.innerHTML = '<div class="col-span-2 glass-card p-8 rounded-xl text-center text-gs-text2 text-sm">' + escapeHtmlText(data.aviso || 'No hay avisos de marcas para este criterio en los diarios cargados.') + '</div>';
            return;
          }
          container.innerHTML = data.marcas.map(m => \`
            <div class="glass-card p-5 rounded-xl border border-gs-border hover:border-gs-strong transition-all text-left">
              <div class="flex flex-wrap items-center justify-between gap-2 mb-2.5 text-xs font-mono">
                <span class="font-bold text-gs-text2">Tomo \${escapeHtmlText(m.tomo)} · N.° \${escapeHtmlText(m.numero)} · \${escapeHtmlText(m.fecha)}</span>
                <span class="font-semibold px-2.5 py-0.5 rounded bg-gs-warning text-gs-ink">Pág. \${escapeHtmlText(m.pagina)}</span>
              </div>
              <h4 class="text-sm font-bold text-gs-text mb-2 break-words">\${escapeHtmlText(m.titular)}</h4>
              <p class="text-xs text-gs-text2 line-clamp-4 leading-relaxed font-mono break-words">\${escapeHtmlText(m.contenido)}</p>
              <div class="text-right mt-2">
                <button type="button" data-ebook-pag="\${escapeHtmlText(parseInt(m.pagina, 10) || 1)}" data-dia="\${escapeHtmlText(m.diarioId)}" data-rec="\${escapeHtmlText(m.id)}" data-term="" class="text-xs text-gs-accent hover:underline font-bold">Ver en el PDF (pág. \${escapeHtmlText(m.pagina)}) &rarr;</button>
              </div>
            </div>
          \`).join('');
        })
        .catch(() => {
          container.innerHTML = '<div class="col-span-2 p-4 text-center text-gs-danger">No pudimos cargar las marcas.</div>';
        });
    }

    // Cargar últimos edictos con badges completos y chips de DUI
    function loadRecentEdictos() {
      const container = document.getElementById('edictos-recientes-container');
      container.innerHTML = '<div class="p-8 text-center text-gs-text2"><i class="fa-solid fa-spinner fa-spin text-2xl text-gs-accent"></i></div>';
      fetch('/api/v1/edictos-recientes')
        .then(r => r.json())
        .then(data => {
          if (!data.edictos || data.edictos.length === 0) {
            container.innerHTML = '<div class="glass-card p-6 text-center text-gs-text2">No hay edictos disponibles.</div>';
            return;
          }
          container.innerHTML = data.edictos.map(e => {
            const clasif = classifyLegalRecordJS(e);
            const firstDui = (e.duisEncontrados && e.duisEncontrados[0]) || '';
            return \`
            <div class="glass-card p-5 rounded-2xl border border-gs-border hover:border-gs-border transition-all text-left">
              <div class="flex flex-wrap justify-between items-center gap-2 text-xs text-gs-text2 font-mono mb-2">
                <div class="flex flex-wrap items-center gap-2">
                  \${getLegalClassificationBadge(clasif)}
                  <button type="button" data-ebook-pag="\${escapeHtmlText(parseInt(e.pagina, 10) || 1)}" data-dia="\${escapeHtmlText(e.diarioId || '')}" data-rec="\${escapeHtmlText(e.id)}" data-term="" class="cursor-pointer px-2.5 py-0.5 rounded bg-gs-warning text-gs-ink font-semibold">
                    Pág. \${escapeHtmlText(e.pagina)}
                  </button>
                </div>
                <span class="font-bold text-gs-text2">Tomo \${escapeHtmlText(e.tomo)} · N° \${escapeHtmlText(e.numero)} · \${escapeHtmlText(e.fecha)}</span>
              </div>
              <h4 class="text-sm font-bold text-gs-text mb-1.5 break-words">\${escapeHtmlText(e.titular)}</h4>
              <p class="text-xs text-gs-text2 line-clamp-3 leading-relaxed font-mono bg-gs-bg p-3 rounded-xl border border-gs-border break-words">\${escapeHtmlText(e.contenido)}</p>
              \${renderDuiChipsHtml(e.duisEncontrados, e.pagina)}
              <div class="mt-3 text-right">
                <button type="button" data-ebook-pag="\${escapeHtmlText(parseInt(e.pagina, 10) || 1)}" data-dia="\${escapeHtmlText(e.diarioId || '')}" data-rec="\${escapeHtmlText(e.id)}" data-term="" class="text-xs text-gs-accent hover:underline font-bold inline-flex items-center gap-1.5">
                  <i class="fa-solid fa-book-open-reader"></i> Abrir en el visor (pág. \${escapeHtmlText(e.pagina)}) &rarr;
                </button>
              </div>
            </div>\`;
          }).join('');
        })
        .catch(() => {
          container.innerHTML = '<div role="alert" class="glass-card p-6 text-center text-gs-danger">No pudimos cargar los edictos. Inténtalo de nuevo en unos segundos.</div>';
        });
    }

    // Cargar decretos y leyes con badges completos
    function loadRecentLeyes() {
      const container = document.getElementById('leyes-recientes-container');
      container.innerHTML = '<div class="p-8 text-center text-gs-text2"><i class="fa-solid fa-spinner fa-spin text-2xl text-gs-accent"></i></div>';
      fetch('/api/v1/leyes-recientes')
        .then(r => r.json())
        .then(data => {
          if (!data.leyes || data.leyes.length === 0) {
            container.innerHTML = '<div class="glass-card p-6 text-center text-gs-text2">No hay leyes disponibles.</div>';
            return;
          }
          container.innerHTML = data.leyes.map(l => {
            const clasif = classifyLegalRecordJS(l);
            return \`
            <div class="glass-card p-5 rounded-2xl border border-gs-border text-left">
              <div class="flex flex-wrap justify-between items-center gap-2 text-xs text-gs-text2 font-mono mb-2">
                <div class="flex items-center gap-2">
                  \${getLegalClassificationBadge(clasif)}
                  <span class="px-2.5 py-0.5 rounded bg-gs-warning text-gs-ink font-semibold">Pág. \${escapeHtmlText(l.pagina)}</span>
                </div>
                <span class="font-bold text-gs-text2">Tomo \${escapeHtmlText(l.tomo)} · N° \${escapeHtmlText(l.numero)} · \${escapeHtmlText(l.fecha)}</span>
              </div>
              <h4 class="text-sm font-bold text-gs-text mb-2 break-words">\${escapeHtmlText(l.titular)}</h4>
              <p class="text-xs text-gs-text2 line-clamp-4 leading-relaxed bg-gs-bg p-3 rounded-xl border border-gs-border mb-2 font-mono break-words">\${escapeHtmlText(l.contenido)}</p>
              <div class="text-right">
                <button type="button" data-ebook-pag="\${escapeHtmlText(parseInt(l.pagina, 10) || 1)}" data-dia="\${escapeHtmlText(l.diarioId || '')}" data-rec="\${escapeHtmlText(l.id)}" data-term="" class="text-xs text-gs-accent hover:underline font-bold inline-flex items-center gap-1.5">
                  <i class="fa-solid fa-book-open-reader"></i> Abrir en el visor (pág. \${escapeHtmlText(l.pagina)}) &rarr;
                </button>
              </div>
            </div>\`;
          }).join('');
        })
        .catch(() => {
          container.innerHTML = '<div role="alert" class="glass-card p-6 text-center text-gs-danger">No pudimos cargar las leyes. Inténtalo de nuevo en unos segundos.</div>';
        });
    }

    function showAlertMsg(ok, text) {
      const el = document.getElementById('alert-msg');
      el.innerText = text;
      el.className = 'text-xs rounded-xl px-3 py-2 ' + (ok ? 'bg-gs-surface2 text-gs-accent border border-gs-border' : 'bg-gs-surface2 text-gs-danger border border-gs-border');
    }

    function submitAlert(e) {
      e.preventDefault();
      const crit = document.getElementById('alert-criterion').value.trim();
      const email = document.getElementById('alert-email').value.trim();
      const phone = document.getElementById('alert-phone').value.trim();

      const evaluado = evaluarCriterio(crit);
      if (!evaluado.ok) return showAlertMsg(false, evaluado.error);
      if (!document.getElementById('alert-consent').checked) return showAlertMsg(false, 'Para guardar la alerta debes aceptar el aviso de privacidad.');
      if (!/^[^@ ]+@[^@ ]+[.][^@ ]{2,}$/.test(email)) return showAlertMsg(false, 'Escribe un correo electrónico válido.');
      if (phone && !/^[+]?[0-9 ()-]{8,20}$/.test(phone)) return showAlertMsg(false, 'El teléfono solo admite números, espacios y el signo +.');

      fetch('/api/v1/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          criterioBusqueda: evaluado.valor,
          tipoCriterio: evaluado.tipo,
          usuarioEmail: email,
          telefonoWhatsapp: phone,
          consentimiento: true
        })
      })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) return showAlertMsg(false, body.error || 'No se pudo registrar la alerta. Revisa los datos.');
        showAlertMsg(true, 'Alerta registrada para «' + evaluado.valor + '».');
        setTimeout(closeModalAlert, 2500);
      })
      .catch(() => showAlertMsg(false, 'No pudimos conectar. Inténtalo de nuevo en unos segundos.'));
    }

    // Ejecutar una búsqueda inicial demostrativa al cargar para mostrar las tarjetas enriquecidas de inmediato
    window.addEventListener('DOMContentLoaded', () => {
      vzIniciar();
      document.addEventListener('click', (ev) => {
        const t = ev.target && ev.target.closest ? ev.target : null;
        if (!t) return;
        const ab = t.closest('[data-ebook-pag]');
        if (ab) { openEbookViewer(parseInt(ab.getAttribute('data-ebook-pag'), 10) || 1, ab.getAttribute('data-term') || '', ab.getAttribute('data-dia') || undefined, ab.getAttribute('data-rec') || undefined); return; }
        const fb = t.closest('[data-focus-term]');
        if (fb) openEbookViewer(parseInt(fb.getAttribute('data-pag'), 10) || 1, fb.getAttribute('data-focus-term') || '', fb.getAttribute('data-dia') || undefined);
      });
      // La búsqueda se puede compartir por enlace (?q=...&categoria=...&forceDui=1&pagina=2) y el botón «atrás» la restaura.
      const aplicarUrl = (primera) => {
        let p;
        try { p = new URLSearchParams(location.search); } catch (_) { p = null; }
        const q = p ? (p.get('q') || '').slice(0, 200) : '';
        if (!q) { return; }
        document.getElementById('query-input').value = q;
        const cat = p.get('categoria') || '';
        const sel = document.getElementById('category-filter');
        sel.value = Array.from(sel.options).some((o) => o.value === cat) ? cat : '';
        document.getElementById('force-dui-check').checked = p.get('forceDui') === '1';
        handleDuiInputPreview(q);
        searchDiario(null, p.get('pagina'), true);
      };
      window.addEventListener('popstate', () => aplicarUrl(false));
      aplicarUrl(true);
    });
  </script>
</body>
</html>`;
}
