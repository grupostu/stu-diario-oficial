import { CRITERIO_CLIENT_JS } from './criterio.js';
import { MASTER_FOOTER_HTML } from './master-footer.js';
import { RESALTADO_CLIENT_JS } from './resaltado.js';
import { LECTURA_CLIENT_JS } from './lectura.js';
import { VISOR_CSS, VISOR_HTML, VISOR_JS } from './visor_cliente.js';
import type { Diario } from './diarios.js';
import { BUSQUEDA_CLIENT_JS } from './busqueda_vista.js';

export function renderPortal(stats: { totalDocumentos: number; totalAlertas: number; diarios: Diario[] }): string {
  const diarios = stats.diarios;
  const ultimo = diarios.length ? diarios[diarios.length - 1]! : null;
  const esc = (t: unknown): string => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
  const etiquetaDiario = (d: Diario): string => `Tomo ${d.tomo} · N.° ${d.numero} · ${d.fecha.split('-').reverse().join('-')}`;
  return `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diarios Oficiales de El Salvador · Busca edictos, marcas y leyes por DUI o nombre</title>
  <meta name="description" content="Busca tu DUI, tu nombre o el de tu empresa en los edictos, marcas y leyes del Diario Oficial de El Salvador, lee el PDF original y recibe alertas por correo cuando aparezcas.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          },
          colors: {
            brand: {
              400: '#34d399',
              500: '#10b981',
              600: '#059669',
            },
            cyan: {
              400: '#38bdf8',
              500: '#06b6d4',
              600: '#0284c7',
            },
            dark: {
              800: '#1e293b',
              900: '#0f172a',
              950: '#020617',
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
    body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    html, body { max-width: 100%; overflow-x: hidden; }
    /* Tap targets táctiles mínimos de 44px (móvil y tablet) */
    @media (pointer: coarse) {
      button, select, input:not([type=checkbox]):not([type=radio]), .tab-btn, summary { min-height: 44px; }
      a.block, a.inline-flex, nav a, footer a { min-height: 44px; display: inline-flex; align-items: center; }
    }
    .glass { background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); }
    .glass-card { background: linear-gradient(135deg, rgba(30, 41, 59, 0.72) 0%, rgba(15, 23, 42, 0.88) 100%); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
    .gradient-text { background: linear-gradient(135deg, #34d399 0%, #38bdf8 50%, #facc15 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .tab-btn.active { background: #10b981; color: #020617; font-weight: 800; border-color: #10b981; }
    
    ${VISOR_CSS}
    /* Fragmentos remarcados interactivos en la transcripción */
    mark.highlight, mark.highlight-clickable {
      background: linear-gradient(135deg, #facc15 0%, #fbbf24 100%);
      color: #020617;
      font-weight: 900;
      padding: 2px 6px;
      border-radius: 5px;
      cursor: pointer;
      box-shadow: 0 0 12px rgba(250, 204, 21, 0.45);
      border: 1px solid #fef08a;
      transition: all 0.2s ease;
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
    mark.highlight-clickable:focus-visible, button:focus-visible, [data-ebook-pag]:focus-visible, a:focus-visible, select:focus-visible, input:focus-visible { outline: 3px solid #38bdf8; outline-offset: 2px; }
    @media (forced-colors: active) { mark { background: Mark; color: MarkText; forced-color-adjust: none; } }
    mark.highlight-clickable:hover {
      transform: scale(1.05);
      background: #fef08a;
      box-shadow: 0 0 20px rgba(250, 204, 21, 0.85);
    }

    /* Contenedor PDF.js + Capa de Texto + Resaltados en el PDF */
    #pdf-page-wrapper {
      position: relative;
      margin: 0 auto 32px auto;
      flex-shrink: 0;
      display: inline-block;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.85);
      border-radius: 8px;
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
    .pdf-highlight-box {
      background: rgba(250, 204, 21, 0.48) !important;
      border: 2px solid #f59e0b !important;
      border-radius: 4px !important;
      box-shadow: 0 0 16px rgba(250, 204, 21, 0.85), inset 0 0 6px rgba(254, 240, 138, 0.7) !important;
      cursor: pointer !important;
      z-index: 10 !important;
      animation: pdfPulseGlow 1.8s infinite alternate;
    }
    .pdf-highlight-box.pdf-radar-focus {
      background: rgba(250, 204, 21, 0.72) !important;
      border: 3px solid #10b981 !important;
      box-shadow: 0 0 0 6px rgba(250, 204, 21, 0.55), 0 0 35px 12px rgba(16, 185, 129, 0.95) !important;
      animation: radarFlash 0.85s ease-in-out 4;
    }
    @keyframes pdfPulseGlow {
      0% { box-shadow: 0 0 10px rgba(250, 204, 21, 0.65); }
      100% { box-shadow: 0 0 22px rgba(245, 158, 11, 0.95); }
    }
    @keyframes radarFlash {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.12); }
    }
    .record-card-flash {
      border-color: #facc15 !important;
      box-shadow: 0 0 28px rgba(250, 204, 21, 0.45) !important;
      background: rgba(250, 204, 21, 0.08) !important;
    }
  </style>
</head>
<body class="bg-dark-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-brand-500 selection:text-slate-950">

  <!-- Cintillo de Deslinde, Transparencia y Fuentes Gubernamentales Oficiales -->
  <div class="bg-slate-950 border-b border-slate-800 text-xs py-2 px-4 text-slate-400">
    <div class="max-w-none mx-auto flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
      <span><i class="fa-solid fa-circle-info text-amber-400 mr-1.5"></i>Sitio independiente de consulta. <strong class="text-slate-200">No es el Diario Oficial ni una entidad del Estado.</strong></span>
      <span>Fuente oficial: <a href="https://www.diariooficial.gob.sv/" target="_blank" rel="noopener noreferrer" class="text-brand-400 hover:underline">diariooficial.gob.sv</a> · <a href="https://www.imprentanacional.gob.sv/" target="_blank" rel="noopener noreferrer" class="text-brand-400 hover:underline">Imprenta Nacional</a></span>
    </div>
  </div>

  <!-- Header Institucional -->
  <header class="border-b border-slate-800/80 bg-slate-950/90 sticky top-0 z-40 backdrop-blur-md">
    <div class="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-0 lg:h-20 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
      <div class="flex items-center gap-3.5 min-w-0">
        <span class="w-12 h-12 shrink-0 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 text-xl" aria-hidden="true"><i class="fa-solid fa-book-open"></i></span>
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-x-2">
            <span class="font-black text-white text-base sm:text-lg tracking-tight">DIARIOS OFICIALES</span>
            <span class="text-brand-400 font-extrabold text-xs tracking-wider uppercase px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">DE EL SALVADOR</span>
          </div>
          <p class="hidden sm:block text-[11px] text-slate-400 font-mono tracking-wide">
            diariosoficiales.grupostu.com <span class="text-slate-600">|</span> Busca en los diarios y léelos con lo buscado resaltado en el PDF
          </p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        ${ultimo ? `<button onclick="openEbookViewer(1, '', '${esc(ultimo.id)}')" class="bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 shadow-md shadow-amber-500/10">
          <i class="fa-solid fa-book-open-reader text-amber-400"></i> Abrir el diario más reciente
        </button>` : ''}
        <button onclick="openModalAlert()" class="bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-400 hover:to-cyan-400 text-slate-950 font-extrabold px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2">
          <i class="fa-solid fa-bell"></i> Vigilancia por DUI
        </button>
      </div>
    </div>
  </header>

  <!-- Métricas Rápidas -->
  <div class="border-b border-slate-800/60 bg-slate-950/40 py-2.5">
    <div class="max-w-none mx-auto px-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
      <div class="flex items-center gap-5 sm:gap-7 flex-wrap">
        <span><strong class="text-white">${stats.totalDocumentos}</strong> publicaciones indexadas</span>
        <span><strong class="text-amber-400">${diarios.length}</strong> ${diarios.length === 1 ? 'diario disponible' : 'diarios disponibles'}${ultimo ? ` · último: ${esc(etiquetaDiario(ultimo))} (${ultimo.paginas} págs.)` : ''}</span>
        <span><strong class="text-brand-400">DUI</strong> en números o en letras</span>
        <span><strong class="text-cyan-400">Sin registro</strong> de tus búsquedas</span>
      </div>
      <div class="flex items-center gap-2 text-emerald-400 font-bold">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Visor de documento listo
      </div>
    </div>
  </div>

  <!-- Contenedor Principal -->
  <main class="flex-1 max-w-none mx-auto px-4 py-8 sm:py-10 w-full">
    
    <!-- Hero Principal con Sellos Gráficos -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold uppercase tracking-wider mb-3">
        <img src="/assets/graphics/icono-detector-dui.svg" alt="DUI" class="w-4 h-4">
        Prevención de Juicios en Rebeldía · Sincronización Bidireccional PDF ↔ Transcripción
      </div>
      <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
        Consulta y Notificaciones del <span class="gradient-text">Diario Oficial de El Salvador</span>
      </h1>
      <p class="mt-3 text-slate-300 text-xs sm:text-base max-w-3xl mx-auto leading-relaxed">
        Verifica al instante si tu <strong>DUI</strong> (en números o en letras notariales), <strong>Nombre</strong> o <strong>Sociedad</strong> figura en edictos de aceptación de herencia, emplazamientos, rebeldías, remates o marcas. Haz clic en cualquier texto remarcado para enfocar el párrafo exacto en el PDF original.
      </p>
    </div>

    <!-- Pestañas de Navegación -->
    <div class="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-3" role="tablist">
      <button onclick="switchTab('dui')" id="tab-btn-dui" class="tab-btn active px-4 py-2.5 rounded-xl border border-slate-700 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all">
        <i class="fa-solid fa-id-card"></i> Buscador de Edictos y DUI
      </button>
      <button onclick="switchTab('marcas')" id="tab-btn-marcas" class="tab-btn px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white text-xs sm:text-sm font-medium flex items-center gap-2 transition-all">
        <i class="fa-solid fa-trademark"></i> Marcas
      </button>
      <button onclick="switchTab('recientes')" id="tab-btn-recientes" class="tab-btn px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white text-xs sm:text-sm font-medium flex items-center gap-2 transition-all">
        <i class="fa-solid fa-gavel"></i> Últimos Edictos Oficiales
      </button>
      <button onclick="switchTab('leyes')" id="tab-btn-leyes" class="tab-btn px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white text-xs sm:text-sm font-medium flex items-center gap-2 transition-all">
        <i class="fa-solid fa-landmark"></i> Decretos y acuerdos
      </button>
      <button onclick="switchTab('hemeroteca')" id="tab-btn-hemeroteca" class="tab-btn px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white text-xs sm:text-sm font-medium flex items-center gap-2 transition-all">
        <i class="fa-solid fa-book-atlas"></i> Hemeroteca y cómo funciona
      </button>
      <button onclick="switchTab('faq')" id="tab-btn-faq" class="tab-btn px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white text-xs sm:text-sm font-medium flex items-center gap-2 transition-all">
        <i class="fa-solid fa-circle-question"></i> Guía Ciudadana
      </button>
    </div>

    <!-- ========================================================================= -->
    <!-- TAB 1: BUSCADOR GENERAL Y DUI -->
    <!-- ========================================================================= -->
    <div id="tab-content-dui" class="space-y-6">
      <div class="glass-card p-5 sm:p-7 rounded-3xl border border-slate-800 shadow-2xl">
        <form onsubmit="searchDiario(event)" novalidate class="space-y-4">
          <div>
            <div class="relative">
              <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
              <input type="text" id="query-input" maxlength="200" aria-label="Buscar en el Diario Oficial" enterkeyhint="search" autocomplete="off" aria-describedby="ayuda-busqueda" placeholder="Ingresa DUI (ej. 00000000-0, 000000000 o en letras), Nombre Completo o Causante..."
                oninput="handleDuiInputPreview(this.value)"
                class="w-full bg-slate-950/90 border border-slate-700 focus:border-brand-500 rounded-2xl pl-11 pr-4 py-4 text-white text-sm outline-none font-mono">
            </div>

            <p id="ayuda-busqueda" class="mt-2 text-[11px] sm:text-xs text-slate-400 leading-relaxed text-left">Puedes buscar por DUI, por nombre, por número de decreto (por ejemplo «Decreto No. 690», «decreto 690» o «D. 690») o por cualquier palabra del texto. Para buscar una frase exacta, escríbela entre comillas, por ejemplo «&quot;amnistía fiscal&quot;». No importan las mayúsculas ni las tildes, y el máximo es de 200 caracteres.</p>


            <!-- Badge dinámico de detección y normalización de DUI -->
            <div id="dui-preview-badge" class="hidden mt-3 p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 text-xs font-mono text-brand-300 flex flex-wrap items-center justify-between gap-2">
              <span id="dui-preview-text"></span>
              <span id="dui-preview-words" class="text-[11px] text-amber-300 font-bold"></span>
            </div>
          </div>
          
          <div class="flex flex-col lg:flex-row gap-3">
            <select id="category-filter" aria-label="Filtrar por sección del Diario Oficial" class="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-slate-300 text-xs sm:text-sm outline-none font-medium">
              <option value="">Todas las Secciones del Diario Oficial</option>
              <option value="EDICTO_JUDICIAL">Edictos Judiciales y Notariales (Herencias, Emplazamientos, Rebeldías)</option>
              <option value="REGISTRO_MARCA">Registro de Marcas y Patentes (CNR)</option>
              <option value="DECRETO_LEGISLATIVO">Decretos de la Asamblea Legislativa</option>
              <option value="SUBASTA_EMBARGO">Subastas, Embargos y Remates Públicos</option>
              <option value="ACUERDO_EJECUTIVO">Acuerdos Ejecutivos y Reglamentos</option>
              <option value="BALANCE_FINANCIERO">Balances y Estados Financieros</option>
              <option value="GENERAL">Otras Publicaciones Oficiales</option>
            </select>

            <div class="flex items-center gap-2 bg-slate-950 px-4 py-3 rounded-2xl border border-slate-700">
              <input type="checkbox" id="force-dui-check" class="w-5 h-5 rounded text-brand-500 focus:ring-0 bg-slate-900 border-slate-600">
              <label for="force-dui-check" class="text-xs text-slate-300 select-none cursor-pointer">Filtrar exclusivamente por DUI</label>
            </div>

            <button type="submit" id="btn-search" class="bg-brand-500 hover:bg-brand-400 text-slate-950 font-black px-8 py-3.5 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-brand-500/20">
              <i class="fa-solid fa-bolt"></i> Consultar Archivo Oficial
            </button>
          </div>
        </form>
      </div>

      <!-- Resultados Dinámicos -->
      <div id="search-aviso" role="alert" class="hidden mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 text-left"></div>
      <div id="search-resumen" role="status" aria-live="polite" aria-atomic="true" class="hidden mb-4 p-4 rounded-2xl bg-slate-900/70 border border-slate-700 text-left outline-none"></div>
      <div id="results-container" class="space-y-4" aria-live="polite" aria-relevant="additions">
        <!-- Renderizado por JS -->
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- TAB 2: BUSCADOR DE MARCAS REGISTRADAS (CNR) -->
    <!-- ========================================================================= -->
    <div id="tab-content-marcas" class="hidden space-y-6">
      <div class="glass-card p-5 sm:p-7 rounded-3xl border border-slate-800 shadow-2xl">
        <div class="flex items-center gap-3 mb-4">
          <img src="/assets/graphics/icono-registro-marca.svg" alt="Marcas CNR" class="w-11 h-11 rounded-xl">
          <div>
            <h3 class="text-lg font-bold text-white">Marcas y signos distintivos</h3>
            <p class="text-xs text-slate-400">Solo se muestran avisos de marcas que aparezcan en los diarios cargados. Si un diario no trae avisos de marcas, no se muestra nada.</p>
          </div>
        </div>

        <form onsubmit="searchMarcas(event)" class="space-y-4">
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
              <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
              <input type="text" id="marca-query" placeholder="Buscar por denominación de marca o titular…"
                class="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-500 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm outline-none">
            </div>
            <button type="submit" class="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2">
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
      <div class="glass-card p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="/assets/graphics/icono-edicto-judicial.svg" alt="Edictos" class="w-11 h-11 rounded-xl">
          <div>
            <h3 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Edictos judiciales y notariales del último diario
            </h3>
            <p class="text-xs text-slate-400">Publicaciones recientes con clasificación jurídica automática, número exacto de página y chips de DUI interactivos.</p>
          </div>
        </div>
        <button onclick="loadRecentEdictos()" class="text-xs text-brand-400 font-bold hover:underline flex items-center gap-1">
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
      <div class="glass-card p-6 rounded-3xl border border-slate-800 flex items-center gap-3">
        <img src="/assets/graphics/icono-decreto-acuerdo.svg" alt="Decretos" class="w-11 h-11 rounded-xl">
        <div>
          <h3 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            Decretos legislativos del último diario
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">Solo se listan decretos cuyo texto se pudo leer en el PDF.</p>
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
      <div class="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 class="text-xl font-black text-white flex items-center gap-2.5">
              <i class="fa-solid fa-book-journal-whills text-amber-400"></i>
              Hemeroteca de diarios
            </h3>
            <p class="text-xs text-slate-400 mt-1">Diarios disponibles para consulta.</p>
          </div>
        </div>

        <!-- Diarios realmente disponibles (se leen del catálogo del servidor, nunca se escriben a mano) -->
        <div>
          <h4 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <i class="fa-solid fa-book-journal-whills text-amber-400"></i> Diarios disponibles para consulta
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            ${diarios.length ? diarios.slice().reverse().map((d) => `
            <button type="button" onclick="openEbookViewer(1, '', '${esc(d.id)}')" class="text-left bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-brand-400 transition-all">
              <span class="text-sm font-bold text-white block">Tomo ${esc(d.tomo)} · N.° ${esc(d.numero)}</span>
              <span class="text-[11px] font-mono text-amber-300 block mt-0.5">${esc(d.fecha.split('-').reverse().join('-'))}</span>
              <span class="text-[11px] text-slate-400 font-mono block mt-1">${esc(d.paginas)} páginas · Abrir diario</span>
            </button>`).join('') : '<p class="text-xs text-slate-400">Aún no hay diarios cargados.</p>'}
          </div>
          <p class="text-[11px] text-slate-500 mt-3">Cada diario se incorpora a partir de su PDF original. Solo se listan los diarios que realmente están cargados.</p>
        </div>

        <!-- Catálogo Visual de Clasificaciones Jurídicas -->
        <div>
          <h4 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <i class="fa-solid fa-layer-group text-brand-400"></i> Clasificación automática (orientativa)
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <img src="/assets/graphics/card-aceptacion-herencia.webp" alt="Aceptación de Herencia" class="w-full rounded-2xl border border-slate-800">
            <img src="/assets/graphics/card-edicto-judicial.webp" alt="Edicto Judicial" class="w-full rounded-2xl border border-slate-800">
            <img src="/assets/graphics/card-declaratoria-rebeldia.webp" alt="Declaratoria de Rebeldía" class="w-full rounded-2xl border border-slate-800">
            <img src="/assets/graphics/card-titulo-supletorio.webp" alt="Título Supletorio" class="w-full rounded-2xl border border-slate-800">
            <img src="/assets/graphics/card-subasta-publica.webp" alt="Subasta Pública" class="w-full rounded-2xl border border-slate-800">
            <img src="/assets/graphics/card-aviso-sociedad.webp" alt="Aviso de Sociedad" class="w-full rounded-2xl border border-slate-800">
            <img src="/assets/graphics/card-decreto-acuerdo.webp" alt="Decreto o Acuerdo" class="w-full rounded-2xl border border-slate-800">
            <img src="/assets/graphics/card-propiedad-intelectual.webp" alt="Propiedad Intelectual" class="w-full rounded-2xl border border-slate-800">
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- TAB 6: GUÍA CIUDADANA Y PREGUNTAS CLAVE -->
    <!-- ========================================================================= -->
    <div id="tab-content-faq" class="hidden space-y-4 text-left">
      <div class="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800">
        <h3 class="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <i class="fa-solid fa-scale-balanced text-brand-400"></i> ¿Qué preguntas debe responder la mayor plataforma de Diarios Oficiales?
        </h3>
        <p class="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
          Los Diarios Oficiales contienen decisiones que afectan directamente la libertad, el patrimonio, las herencias y los negocios de los ciudadanos de El Salvador. Aquí respondemos las dudas jurídicas y prácticas más críticas:
        </p>

        <div class="space-y-4">
          <div class="bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
            <h4 class="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
              <span class="text-brand-400">01.</span> ¿Qué consecuencias legales tiene que mi DUI aparezca en un edicto judicial?
            </h4>
            <p class="text-xs text-slate-300 leading-relaxed">
              En El Salvador, cuando un juzgado civil, mercantil o de sentencia no encuentra a una persona demandada o imputada, la ley ordena emplazarla por <strong>edicto en el Diario Oficial</strong>. Si no te presentas con tu abogado en el plazo concedido (usualmente 10 días hábiles), el tribunal te declara formalmente en <strong>calidad de rebeldía</strong> y dicta sentencia condenatoria o embargo ejecutivo sin que hayas ejercido tu derecho de defensa.
            </p>
          </div>

          <div class="bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
            <h4 class="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
              <span class="text-cyan-400">02.</span> ¿Cómo reclamar o verificar una herencia si vi a un familiar en un edicto?
            </h4>
            <p class="text-xs text-slate-300 leading-relaxed">
              Los edictos de aceptación de herencia (publicados por juzgados civiles y por notarios) confieren la <em>administración y representación definitiva de la sucesión</em> a los herederos declarados. Si consideras que tienes igual o mejor derecho hereditario, el edicto publicado en el Diario Oficial es la prueba legal para personarte ante el juez o notario.
            </p>
          </div>

          <div class="bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
            <h4 class="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
              <span class="text-amber-400">03.</span> ¿Cómo funciona la sincronización entre la transcripción y el PDF original?
            </h4>
            <p class="text-xs text-slate-300 leading-relaxed">
              Nuestro visor utiliza <strong>PDF.js con capa vectorial de texto</strong>. Cuando buscas un DUI (incluso si el juez lo redactó en letras como <em>CERO CERO TRES CINCO SEIS DOS SIETE CUATRO - DOS</em>), el sistema remarca automáticamente los fragmentos en la columna derecha y dibuja resaltados fluorescentes sobre el PDF a la izquierda. Al hacer clic en cualquier fragmento remarcado, el PDF hace scroll y zoom directo hacia la línea exacta con un destello de radar.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Marco Legal, Términos y Condiciones y Descargo de Responsabilidad de Grupo Stu, S.A.S. -->
    <div class="mt-8 p-6 rounded-2xl border border-slate-800/90 bg-slate-950/85 text-xs text-slate-400 leading-relaxed text-left space-y-3">
      <div class="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2.5">
        <div class="flex items-center gap-2.5 text-slate-100 font-bold">
          <span class="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <i class="fa-solid fa-scale-balanced"></i>
          </span>
          <span>Términos de Uso, Naturaleza Informativa y Descargo Legal de Responsabilidad — Grupo Stu, S.A.S.</span>
        </div>
        <span class="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">Uso informativo</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
        <div class="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/70">
          <strong class="text-white block mb-1">1. Información Pública Oficiosa (LAIP):</strong>
          De conformidad con los Arts. 10 y 11 de la <em>Ley de Acceso a la Información Pública</em> de El Salvador, las publicaciones del Diario Oficial son información de libre acceso y dominio público. Este portal facilita su búsqueda tecnológica.
        </div>
        <div class="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/70">
          <strong class="text-white block mb-1">2. No Sustitución ni Carácter Certificante:</strong>
          <strong>Grupo Stu, S.A.S.</strong> es una entidad privada e independiente; no representa ni sustituye a la Imprenta Nacional (<code>diariooficial.gob.sv</code>) ni emite certificaciones, constancias oficiales o copias fieles con valor probatorio judicial.
        </div>
        <div class="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/70">
          <strong class="text-amber-300 block mb-1">3. Limitación Total de Responsabilidad:</strong>
          Las transcripciones se extraen automáticamente del texto del PDF y se ofrecen «tal cual» con fines orientativos. <strong>Grupo Stu, S.A.S. no es responsable de la exactitud de la información contenida ni del uso, interpretación o decisiones tomadas por el usuario.</strong>
        </div>
      </div>
    </div>
  </main>

  ${VISOR_HTML}

  <!-- Modal para Suscripción de Alertas Preventivas -->
  <div id="modal-alert" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm hidden items-center justify-center p-4 z-50">
    <div class="glass-card max-w-md w-full p-6 sm:p-8 rounded-3xl border border-slate-700 text-left">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-bell text-brand-400"></i> Alerta Preventiva por DUI
        </h3>
        <button onclick="closeModalAlert()" class="text-slate-400 hover:text-white text-lg"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <p class="text-xs text-slate-300 mb-6 leading-relaxed">
        Nuestro motor revisa cada nueva publicación del Diario Oficial. Si se detecta tu número de DUI, nombre o sociedad en un edicto judicial, orden de captura, embargo o registro de marca, te enviaremos una notificación inmediata.
      </p>
      <form onsubmit="submitAlert(event)" novalidate class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">DUI o Nombre a Monitorear</label>
          <input type="text" id="alert-criterion" placeholder="ej. 00000000-0 o Nombre Completo" required
            class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none font-mono focus:border-brand-500">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">Correo Electrónico para Alertas</label>
          <input type="email" id="alert-email" placeholder="correo@ejemplo.com" required
            class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-500">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">WhatsApp de Urgencia (Opcional)</label>
          <input type="tel" id="alert-phone" placeholder="+503 7000-0000"
            class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-500">
        </div>
        <div class="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-[11px] leading-relaxed text-slate-300">
          <p><strong class="text-white">Aviso de privacidad.</strong> Grupo Stu, S.A.S. usa tu correo, tu WhatsApp (si lo das) y el DUI o nombre que escribas solo para enviarte alertas cuando aparezcan en el Diario Oficial. Los guardamos mientras la alerta siga activa y puedes pedir la baja y el borrado en cualquier momento. No los vendemos ni los usamos para otra cosa. <a href="/privacidad" target="_blank" rel="noopener" class="text-brand-400 underline">Leer el aviso completo</a>.</p>
        </div>
        <label class="flex items-start gap-2 text-xs text-slate-200 cursor-pointer">
          <input type="checkbox" id="alert-consent" required class="mt-0.5 h-4 w-4 accent-emerald-500">
          <span>He leído el aviso de privacidad y autorizo a Grupo Stu, S.A.S. a tratar estos datos para enviarme las alertas.</span>
        </label>
        <p id="alert-msg" role="status" class="hidden text-xs rounded-xl px-3 py-2"></p>
        <button type="submit" class="w-full bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-400 hover:to-cyan-400 text-slate-950 font-black py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-brand-500/20">
          Guardar Alerta y Proteger mi Identidad
        </button>
      </form>
    </div>
  </div>

  ${MASTER_FOOTER_HTML}

  <script>
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
        'Aceptación de Herencia': { icon: '/assets/graphics/icono-aceptacion-herencia.svg', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' },
        'Declaratoria de Rebeldía': { icon: '/assets/graphics/icono-declaratoria-rebeldia.svg', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40' },
        'Título Supletorio': { icon: '/assets/graphics/icono-titulo-supletorio.svg', cls: 'bg-purple-500/15 text-purple-300 border-purple-500/40' },
        'Subasta Pública': { icon: '/assets/graphics/icono-subasta-publica.svg', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40' },
        'Aviso de Sociedad': { icon: '/assets/graphics/icono-aviso-sociedad.svg', cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40' },
        'Decreto/Acuerdo': { icon: '/assets/graphics/icono-decreto-acuerdo.svg', cls: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40' },
        'Edicto Judicial': { icon: '/assets/graphics/icono-edicto-judicial.svg', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/40' }
      };
      const st = map[label] || map['Edicto Judicial'];
      return \`<span class="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border \${st.cls}">
        <img src="\${st.icon}" alt="" class="w-4 h-4"> \${escapeHtmlText(label)}
      </span>\`;
    }

    function renderDuiChipsHtml(duis, pagina) {
      if (!duis || duis.length === 0) return '';
      return '<div class="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-2">' +
        '<span class="text-[11px] font-mono text-amber-400 font-bold flex items-center gap-1"><i class="fa-solid fa-fingerprint"></i> DUIs Identificados:</span>' +
        duis.map(dui => {
          const words = duiToNotarialWordsJS(dui);
          return \`<button type="button" data-ebook-pag="\${escapeHtmlText(parseInt(pagina, 10) || 1)}" data-term="\${escapeHtmlText(dui)}" title="Clic para abrir el Visor Ebook en Pág. \${escapeHtmlText(parseInt(pagina, 10) || 1)} y localizar en el PDF: \${escapeHtmlText(words)}"
            class="group px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-500/40 text-xs font-mono font-black transition-all flex items-center gap-1.5 shadow-sm">
            <span>\${escapeHtmlText(dui)}</span>
            <span class="text-[10px] text-amber-200/80 group-hover:text-slate-900 font-normal hidden sm:inline">(\${escapeHtmlText(words.split(' ').slice(0, 3).join(' '))}...)</span>
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
        text.innerHTML = '<i class="fa-solid fa-fingerprint text-brand-400 mr-1.5"></i> DUI: <strong class="text-white">' + formatted + '</strong>';
        wordsEl.innerText = 'En letras: ' + duiToNotarialWordsJS(formatted);
        badge.classList.remove('hidden');
      } else if (clean.length >= 6 && clean.length < 9 && /^[0-9 -]+$/.test(val.trim())) {
        text.innerHTML = '<i class="fa-solid fa-circle-info text-amber-400 mr-1.5"></i> DUI incompleto: llevas ' + clean.length + ' de 9 dígitos';
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
        const btn = document.getElementById('tab-btn-' + t);
        const content = document.getElementById('tab-content-' + t);
        if (!btn || !content) return;
        if (t === tabId) {
          btn.classList.add('active');
          btn.classList.remove('bg-slate-900/60', 'text-slate-300');
          content.classList.remove('hidden');
        } else {
          btn.classList.remove('active');
          btn.classList.add('bg-slate-900/60', 'text-slate-300');
          content.classList.add('hidden');
        }
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
      contenedor.innerHTML = '<div role="alert" class="glass-card p-6 rounded-3xl text-center border border-rose-500/40">' +
        '<h4 class="text-base font-bold text-white">' + escapeHtmlText(titulo) + '</h4>' +
        '<p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">' + escapeHtmlText(detalle) + '</p>' +
        (conReintento ? '<button type="button" data-gs-reintentar="1" class="mt-3 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-brand-400 font-bold text-xs">Reintentar</button>' : '') +
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
      resContainer.innerHTML = '<div class="glass-card p-10 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-3xl text-brand-400"></i><p class="mt-3 text-sm font-mono">Buscando en los títulos, números de decreto, órganos emisores y en cada párrafo de las publicaciones oficiales...</p></div>';

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
            resContainer.innerHTML = '<div role="alert" class="glass-card p-6 rounded-3xl text-center border border-amber-500/40"><i class="fa-solid fa-triangle-exclamation text-3xl text-amber-400 mb-2"></i><h4 class="text-base font-bold text-white">Revisa lo que escribiste</h4><p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">' + escapeHtmlText(data.aviso || 'La consulta no es válida.') + '</p></div>';
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
            resContainer.innerHTML = '<div role="alert" class="glass-card p-6 rounded-3xl text-center border border-amber-500/40"><i class="fa-solid fa-triangle-exclamation text-3xl text-amber-400 mb-2"></i><h4 class="text-base font-bold text-white">Revisa lo que escribiste</h4><p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">' + escapeHtmlText(data.aviso || 'La consulta no es válida.') + ' Todavía no se hizo una consulta confiable, así que no podemos decir si aparece o no en el archivo.</p></div>';
            return;
          }

          gsConsultaActual = String(data.duiNormalized || q).replace(/["“”«»]/g, '');

          if (data.resultados.length === 0) {
            const fuera = data.total > 0 && pag > data.totalPaginas;
            resumenEl.innerHTML = '<p class="text-xs sm:text-sm text-slate-200">' + (fuera
              ? 'La página que pediste no existe: esta búsqueda solo tiene ' + escapeHtmlText(data.totalPaginas) + ' páginas de resultados.'
              : 'No se encontraron publicaciones que contengan todo lo que buscaste.') + '</p>';
            resumenEl.classList.remove('hidden');
            resContainer.innerHTML = '<div class="glass-card p-8 sm:p-10 rounded-3xl text-center text-slate-400 border border-slate-800">' +
              '<i class="fa-regular fa-circle-check text-4xl text-brand-400 mb-3"></i>' +
              '<h4 class="text-base sm:text-lg font-bold text-white">Sin publicaciones oficiales encontradas</h4>' +
              '<p class="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">El criterio «<strong>' + escapeHtmlText(q) + '</strong>» no aparece en los títulos, números de decreto, órganos emisores ni en el texto de las publicaciones de este tomo. Prueba con menos palabras, revisa la ortografía (no importan las tildes ni las mayúsculas) o quita el filtro de sección.</p>' +
              '<div class="mt-5"><button type="button" onclick="openModalAlert()" class="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-brand-400 font-bold text-xs hover:bg-slate-800">Crear una alerta para este criterio</button></div></div>';
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
      container.innerHTML = '<div class="col-span-2 p-8 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-2xl text-brand-400"></i></div>';
      fetch('/api/v1/marcas?q=' + encodeURIComponent(q))
        .then(r => { if (!r.ok) throw new Error('http'); return r.json(); })
        .then(data => {
          if (!data.marcas || data.marcas.length === 0) {
            container.innerHTML = '<div class="col-span-2 glass-card p-8 rounded-3xl text-center text-slate-300 text-sm">' + escapeHtmlText(data.aviso || 'No hay avisos de marcas para este criterio en los diarios cargados.') + '</div>';
            return;
          }
          container.innerHTML = data.marcas.map(m => \`
            <div class="glass-card p-5 rounded-3xl border border-slate-800 hover:border-brand-500/50 transition-all text-left">
              <div class="flex flex-wrap items-center justify-between gap-2 mb-2.5 text-xs font-mono">
                <span class="font-bold text-slate-300">Tomo \${escapeHtmlText(m.tomo)} · N.° \${escapeHtmlText(m.numero)} · \${escapeHtmlText(m.fecha)}</span>
                <span class="font-black px-2.5 py-0.5 rounded bg-amber-400 text-slate-950">Pág. \${escapeHtmlText(m.pagina)}</span>
              </div>
              <h4 class="text-sm font-bold text-white mb-2 break-words">\${escapeHtmlText(m.titular)}</h4>
              <p class="text-xs text-slate-300 line-clamp-4 leading-relaxed font-mono break-words">\${escapeHtmlText(m.contenido)}</p>
              <div class="text-right mt-2">
                <button type="button" data-ebook-pag="\${escapeHtmlText(parseInt(m.pagina, 10) || 1)}" data-dia="\${escapeHtmlText(m.diarioId)}" data-rec="\${escapeHtmlText(m.id)}" data-term="" class="text-xs text-brand-400 hover:underline font-bold">Ver en el PDF (pág. \${escapeHtmlText(m.pagina)}) &rarr;</button>
              </div>
            </div>
          \`).join('');
        })
        .catch(() => {
          container.innerHTML = '<div class="col-span-2 p-4 text-center text-rose-300">No pudimos cargar las marcas.</div>';
        });
    }

    // Cargar últimos edictos con badges completos y chips de DUI
    function loadRecentEdictos() {
      const container = document.getElementById('edictos-recientes-container');
      container.innerHTML = '<div class="p-8 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-2xl text-brand-400"></i></div>';
      fetch('/api/v1/edictos-recientes')
        .then(r => r.json())
        .then(data => {
          if (!data.edictos || data.edictos.length === 0) {
            container.innerHTML = '<div class="glass-card p-6 text-center text-slate-400">No hay edictos disponibles.</div>';
            return;
          }
          container.innerHTML = data.edictos.map(e => {
            const clasif = classifyLegalRecordJS(e);
            const firstDui = (e.duisEncontrados && e.duisEncontrados[0]) || '';
            return \`
            <div class="glass-card p-5 rounded-2xl border border-slate-800 hover:border-brand-500/40 transition-all text-left">
              <div class="flex flex-wrap justify-between items-center gap-2 text-xs text-slate-400 font-mono mb-2">
                <div class="flex flex-wrap items-center gap-2">
                  \${getLegalClassificationBadge(clasif)}
                  <button type="button" data-ebook-pag="\${escapeHtmlText(parseInt(e.pagina, 10) || 1)}" data-dia="\${escapeHtmlText(e.diarioId || '')}" data-rec="\${escapeHtmlText(e.id)}" data-term="" class="cursor-pointer px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black">
                    Pág. \${escapeHtmlText(e.pagina)}
                  </button>
                </div>
                <span class="font-bold text-slate-300">Tomo \${escapeHtmlText(e.tomo)} · N° \${escapeHtmlText(e.numero)} · \${escapeHtmlText(e.fecha)}</span>
              </div>
              <h4 class="text-sm font-bold text-white mb-1.5 break-words">\${escapeHtmlText(e.titular)}</h4>
              <p class="text-xs text-slate-300 line-clamp-3 leading-relaxed font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800/70 break-words">\${escapeHtmlText(e.contenido)}</p>
              \${renderDuiChipsHtml(e.duisEncontrados, e.pagina)}
              <div class="mt-3 text-right">
                <button type="button" data-ebook-pag="\${escapeHtmlText(parseInt(e.pagina, 10) || 1)}" data-dia="\${escapeHtmlText(e.diarioId || '')}" data-rec="\${escapeHtmlText(e.id)}" data-term="" class="text-xs text-brand-400 hover:underline font-bold inline-flex items-center gap-1.5">
                  <i class="fa-solid fa-book-open-reader"></i> Abrir en el visor (pág. \${escapeHtmlText(e.pagina)}) &rarr;
                </button>
              </div>
            </div>\`;
          }).join('');
        })
        .catch(() => {
          container.innerHTML = '<div role="alert" class="glass-card p-6 text-center text-rose-300">No pudimos cargar los edictos. Inténtalo de nuevo en unos segundos.</div>';
        });
    }

    // Cargar decretos y leyes con badges completos
    function loadRecentLeyes() {
      const container = document.getElementById('leyes-recientes-container');
      container.innerHTML = '<div class="p-8 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-2xl text-cyan-400"></i></div>';
      fetch('/api/v1/leyes-recientes')
        .then(r => r.json())
        .then(data => {
          if (!data.leyes || data.leyes.length === 0) {
            container.innerHTML = '<div class="glass-card p-6 text-center text-slate-400">No hay leyes disponibles.</div>';
            return;
          }
          container.innerHTML = data.leyes.map(l => {
            const clasif = classifyLegalRecordJS(l);
            return \`
            <div class="glass-card p-5 rounded-2xl border border-slate-800 text-left">
              <div class="flex flex-wrap justify-between items-center gap-2 text-xs text-slate-400 font-mono mb-2">
                <div class="flex items-center gap-2">
                  \${getLegalClassificationBadge(clasif)}
                  <span class="px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black">Pág. \${escapeHtmlText(l.pagina)}</span>
                </div>
                <span class="font-bold text-slate-300">Tomo \${escapeHtmlText(l.tomo)} · N° \${escapeHtmlText(l.numero)} · \${escapeHtmlText(l.fecha)}</span>
              </div>
              <h4 class="text-sm font-bold text-white mb-2 break-words">\${escapeHtmlText(l.titular)}</h4>
              <p class="text-xs text-slate-300 line-clamp-4 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 mb-2 font-mono break-words">\${escapeHtmlText(l.contenido)}</p>
              <div class="text-right">
                <button type="button" data-ebook-pag="\${escapeHtmlText(parseInt(l.pagina, 10) || 1)}" data-dia="\${escapeHtmlText(l.diarioId || '')}" data-rec="\${escapeHtmlText(l.id)}" data-term="" class="text-xs text-cyan-400 hover:underline font-bold inline-flex items-center gap-1.5">
                  <i class="fa-solid fa-book-open-reader"></i> Abrir en el visor (pág. \${escapeHtmlText(l.pagina)}) &rarr;
                </button>
              </div>
            </div>\`;
          }).join('');
        })
        .catch(() => {
          container.innerHTML = '<div role="alert" class="glass-card p-6 text-center text-rose-300">No pudimos cargar las leyes. Inténtalo de nuevo en unos segundos.</div>';
        });
    }

    function showAlertMsg(ok, text) {
      const el = document.getElementById('alert-msg');
      el.innerText = text;
      el.className = 'text-xs rounded-xl px-3 py-2 ' + (ok ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/10 text-red-300 border border-red-500/30');
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
