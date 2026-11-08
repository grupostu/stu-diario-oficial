import { CRITERIO_CLIENT_JS } from './criterio.js';
import { MASTER_FOOTER_HTML } from './master-footer.js';

export function renderPortal(stats: { totalDocumentos: number; totalAlertas: number }): string {
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
  <div class="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 text-xs py-2 px-4 text-center text-slate-400">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
      <span class="flex items-center gap-2">
        <img src="/assets/graphics/escudo-soberania-documental.svg" alt="Escudo Soberanía" class="w-4 h-4 inline-block">
        <span>REPÚBLICA DE EL SALVADOR · ARCHIVO CÍVICO SOBERANO DE DIARIOS OFICIALES</span>
      </span>
      <div class="flex items-center gap-3">
        <span>Fuente Primaria Oficial: <a href="https://www.diariooficial.gob.sv/" target="_blank" rel="noopener noreferrer" class="text-brand-400 hover:underline">diariooficial.gob.sv</a> · <a href="https://www.imprentanacional.gob.sv/" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:underline">Imprenta Nacional</a></span>
        <span class="text-slate-500">|</span>
        <span class="text-slate-300">Dominio Público: <strong>LAIP Arts. 10 y 11</strong></span>
      </div>
    </div>
  </div>

  <!-- Header Institucional -->
  <header class="border-b border-slate-800/80 bg-slate-950/90 sticky top-0 z-40 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-0 lg:h-20 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
      <div class="flex items-center gap-3.5 min-w-0">
        <img src="/assets/graphics/escudo-soberania-documental.svg" alt="Escudo Diario Oficial" class="w-12 h-12 shrink-0 rounded-2xl shadow-lg shadow-brand-500/20 border border-brand-500/30">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-x-2">
            <span class="font-black text-white text-base sm:text-lg tracking-tight">DIARIOS OFICIALES</span>
            <span class="text-brand-400 font-extrabold text-xs tracking-wider uppercase px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">DE EL SALVADOR</span>
          </div>
          <p class="hidden sm:block text-[11px] text-slate-400 font-mono tracking-wide">
            diariosoficiales.grupostu.com <span class="text-slate-600">|</span> Visor Ebook PDF.js con Remarcado en Vivo y Alertas por DUI
          </p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        <button onclick="openEbookViewer(59, 'Herencia')" class="bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 shadow-md shadow-amber-500/10">
          <i class="fa-solid fa-book-open-reader text-amber-400"></i> Abrir Visor Ebook (Demo Pág. 59)
        </button>
        <button onclick="openModalAlert()" class="bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-400 hover:to-cyan-400 text-slate-950 font-extrabold px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2">
          <i class="fa-solid fa-bell"></i> Vigilancia por DUI
        </button>
      </div>
    </div>
  </header>

  <!-- Métricas Rápidas -->
  <div class="border-b border-slate-800/60 bg-slate-950/40 py-2.5">
    <div class="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
      <div class="flex items-center gap-5 sm:gap-7 flex-wrap">
        <span><strong class="text-white">${stats.totalDocumentos}</strong> Registros Transcritos</span>
        <span><strong class="text-amber-400">Tomo 453 · N° 198</strong> (164 Págs HD)</span>
        <span><strong class="text-brand-400">Búsqueda Dual</strong> (DUI en Números + Letras Notariales)</span>
        <span><strong class="text-cyan-400">Sin registro</strong> de tus búsquedas</span>
      </div>
      <div class="flex items-center gap-2 text-emerald-400 font-bold">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Visor de documento listo
      </div>
    </div>
  </div>

  <!-- Contenedor Principal -->
  <main class="flex-1 max-w-6xl mx-auto px-4 py-8 sm:py-10 w-full">
    
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
        Verifica al instante si tu <strong>DUI</strong> (en números, por ejemplo <code>00000000-0</code>, que es un número ficticio o en letras <code>CERO CERO TRES...</code>), <strong>Nombre</strong> o <strong>Sociedad</strong> figura en edictos de aceptación de herencia, emplazamientos, rebeldías, remates o marcas del CNR. Haz clic en cualquier texto remarcado para enfocar el párrafo exacto en el PDF original.
      </p>
    </div>

    <!-- Pestañas de Navegación -->
    <div class="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-3" role="tablist">
      <button onclick="switchTab('dui')" id="tab-btn-dui" class="tab-btn active px-4 py-2.5 rounded-xl border border-slate-700 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all">
        <i class="fa-solid fa-id-card"></i> Buscador de Edictos y DUI
      </button>
      <button onclick="switchTab('marcas')" id="tab-btn-marcas" class="tab-btn px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white text-xs sm:text-sm font-medium flex items-center gap-2 transition-all">
        <i class="fa-solid fa-trademark"></i> Buscador de Marcas (CNR)
      </button>
      <button onclick="switchTab('recientes')" id="tab-btn-recientes" class="tab-btn px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white text-xs sm:text-sm font-medium flex items-center gap-2 transition-all">
        <i class="fa-solid fa-gavel"></i> Últimos Edictos Oficiales
      </button>
      <button onclick="switchTab('leyes')" id="tab-btn-leyes" class="tab-btn px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white text-xs sm:text-sm font-medium flex items-center gap-2 transition-all">
        <i class="fa-solid fa-landmark"></i> Decretos y Leyes (Amnistía D.L. 690)
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
              <input type="text" id="query-input" placeholder="Ingresa DUI (ej. 00000000-0, 000000000 o en letras), Nombre Completo o Causante..."
                oninput="handleDuiInputPreview(this.value)"
                class="w-full bg-slate-950/90 border border-slate-700 focus:border-brand-500 rounded-2xl pl-11 pr-4 py-4 text-white text-sm outline-none font-mono">
            </div>

            <!-- Demostraciones rápidas 1-clic -->
            <div class="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
              <span>Pruebas rápidas en vivo:</span>
              <button type="button" onclick="quickSearchDemo('00000000-0')" class="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold transition-all">
                <i class="fa-solid fa-fingerprint mr-1"></i>DUI de ejemplo 00000000-0
              </button>
              <button type="button" onclick="quickSearchDemo('Persona de ejemplo')" class="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold transition-all">
                <i class="fa-solid fa-user-check mr-1"></i>Nombre de ejemplo
              </button>
              <button type="button" onclick="quickSearchDemo('Decreto No. 690')" class="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold transition-all">
                <i class="fa-solid fa-landmark mr-1"></i>Amnistía Fiscal D.L. 690
              </button>
            </div>

            <!-- Badge dinámico de detección y normalización de DUI -->
            <div id="dui-preview-badge" class="hidden mt-3 p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 text-xs font-mono text-brand-300 flex flex-wrap items-center justify-between gap-2">
              <span id="dui-preview-text"></span>
              <span id="dui-preview-words" class="text-[11px] text-amber-300 font-bold"></span>
            </div>
          </div>
          
          <div class="flex flex-col lg:flex-row gap-3">
            <select id="category-filter" class="flex-1 min-w-0bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-slate-300 text-xs sm:text-sm outline-none font-medium">
              <option value="">Todas las Secciones del Diario Oficial</option>
              <option value="EDICTO_JUDICIAL">Edictos Judiciales y Notariales (Herencias, Emplazamientos, Rebeldías)</option>
              <option value="REGISTRO_MARCA">Registro de Marcas y Patentes (CNR)</option>
              <option value="DECRETO_LEGISLATIVO">Decretos de la Asamblea Legislativa</option>
              <option value="SUBASTA_EMBARGO">Subastas, Embargos y Remates Públicos</option>
              <option value="ACUERDO_EJECUTIVO">Acuerdos Ejecutivos y Reglamentos</option>
            </select>

            <div class="flex items-center gap-2 bg-slate-950 px-4 py-3 rounded-2xl border border-slate-700">
              <input type="checkbox" id="force-dui-check" class="w-5 h-5 roundedtext-brand-500 focus:ring-0 bg-slate-900 border-slate-600">
              <label for="force-dui-check" class="text-xs text-slate-300 select-none cursor-pointer">Filtrar exclusivamente por DUI</label>
            </div>

            <button type="submit" id="btn-search" class="bg-brand-500 hover:bg-brand-400 text-slate-950 font-black px-8 py-3.5 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-brand-500/20">
              <i class="fa-solid fa-bolt"></i> Consultar Archivo Oficial
            </button>
          </div>
        </form>
      </div>

      <!-- Resultados Dinámicos -->
      <div id="search-aviso" role="status" class="hidden mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 text-left"></div>
      <div id="results-container" class="space-y-4">
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
            <h3 class="text-lg font-bold text-white">Buscador de Marcas y Signos Distintivos (CNR)</h3>
            <p class="text-xs text-slate-400">Publicaciones en el Diario Oficial para plazo legal de oposición de terceros conforme a la Ley de Marcas de El Salvador.</p>
          </div>
        </div>

        <form onsubmit="searchMarcas(event)" class="space-y-4">
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
              <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
              <input type="text" id="marca-query" placeholder="Buscar por denominación de marca, titular (ej. Grupo Stu) o producto..."
                class="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-500 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm outline-none">
            </div>
            <select id="marca-clase" class="bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3.5 text-slate-300 text-xs sm:text-sm outline-none font-medium">
              <option value="">Todas las Clases de Niza</option>
              <option value="1">Clase 1 (Químicos y Fertilizantes)</option>
              <option value="5">Clase 5 (Farmacéuticos y Medicina)</option>
              <option value="25">Clase 25 (Prendas de vestir y calzado)</option>
              <option value="30">Clase 30 (Café, harinas, alimentos)</option>
              <option value="32">Clase 32 (Cervezas, aguas y bebidas)</option>
              <option value="36">Clase 36 (Finanzas, seguros y bienes raíces)</option>
              <option value="37">Clase 37 (Construcción y reparación)</option>
              <option value="42">Clase 42 (Software, Cloud y Tecnología)</option>
              <option value="43">Clase 43 (Restaurantes y hospedaje)</option>
              <option value="45">Clase 45 (Servicios jurídicos y de seguridad)</option>
            </select>
            <button type="submit" class="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2">
              <i class="fa-solid fa-filter"></i> Filtrar Marcas
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
              Últimos Edictos Judiciales y Notariales Indexados
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
            Decretos Legislativos y Amnistías Recientes
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">Normas legales promulgadas y publicadas en el Diario Oficial de la República de El Salvador.</p>
        </div>
      </div>
      <div id="leyes-recientes-container" class="space-y-4">
        <!-- Renderizado por JS -->
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- TAB 5: HEMEROTECA DIGITAL, TOMOS Y ARQUITECTURA OCR -->
    <!-- ========================================================================= -->
    <div id="tab-content-hemeroteca" class="hidden space-y-6 text-left">
      <div class="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 class="text-xl font-black text-white flex items-center gap-2.5">
              <img src="/assets/graphics/sello-certificacion-stu.svg" alt="" aria-hidden="true" class="w-8 h-8">
              Hemeroteca de tomos publicados
            </h3>
            <p class="text-xs text-slate-400 mt-1">Tomos disponibles para consulta y esquemas de cómo se prepara el texto de cada página.</p>
          </div>
          <img src="/assets/graphics/badge-coincidencia-exacta.svg" alt="Verificado" class="h-10">
        </div>

        <!-- Diagramas Vectoriales del Motor OCR y Sincronización -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-slate-950/90 p-4 rounded-2xl border border-slate-800">
            <h4 class="text-xs font-mono font-bold text-brand-400 uppercase mb-2">Cómo se convierte el PDF en texto consultable</h4>
            <img src="/assets/graphics/diagrama-ocr-limpio.svg" alt="Diagrama OCR Limpio" class="w-full rounded-xl">
          </div>
          <div class="bg-slate-950/90 p-4 rounded-2xl border border-slate-800">
            <h4 class="text-xs font-mono font-bold text-cyan-400 uppercase mb-2">Cómo se enlaza el texto con la página del PDF</h4>
            <img src="/assets/graphics/diagrama-arquitectura-o1.svg" alt="Diagrama O(1)" class="w-full rounded-xl">
          </div>
        </div>

        <!-- Galería de Tomos Encuadernados -->
        <div>
          <h4 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <i class="fa-solid fa-book-journal-whills text-amber-400"></i> Colección de Tomos Oficiales Digitalizados
          </h4>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div onclick="openEbookViewer(1)" class="cursor-pointer group bg-slate-950 p-2.5 rounded-2xl border border-amber-500/40 hover:border-amber-400 transition-all text-center">
              <img src="/assets/graphics/tomo-historico-453.webp" alt="Tomo 453" class="w-full rounded-xl mb-2 group-hover:scale-105 transition-transform">
              <span class="text-[11px] font-mono font-bold text-amber-300 block">Tomo 453 · N° 198</span>
              <span class="text-[10px] text-emerald-400 font-mono">164 Págs · Activo</span>
            </div>
            <div onclick="openEbookViewer(47)" class="cursor-pointer group bg-slate-950 p-2.5 rounded-2xl border border-slate-800 hover:border-cyan-400 transition-all text-center">
              <img src="/assets/graphics/tomo-historico-452.webp" alt="Tomo 452" class="w-full rounded-xl mb-2 group-hover:scale-105 transition-transform">
              <span class="text-[11px] font-mono font-bold text-slate-200 block">Sección Carteles</span>
              <span class="text-[10px] text-cyan-400 font-mono">Pág. 47 · Edictos</span>
            </div>
            <div onclick="openEbookViewer(59, 'Herencia')" class="cursor-pointer group bg-slate-950 p-2.5 rounded-2xl border border-slate-800 hover:border-brand-400 transition-all text-center">
              <img src="/assets/graphics/tomo-historico-451.webp" alt="Tomo 451" class="w-full rounded-xl mb-2 group-hover:scale-105 transition-transform">
              <span class="text-[11px] font-mono font-bold text-slate-200 block">Sucesiones Civil</span>
              <span class="text-[10px] text-brand-400 font-mono">Pág. 59 · Herencias</span>
            </div>
            <div onclick="openEbookViewer(92)" class="cursor-pointer group bg-slate-950 p-2.5 rounded-2xl border border-slate-800 hover:border-purple-400 transition-all text-center">
              <img src="/assets/graphics/tomo-historico-450.webp" alt="Tomo 450" class="w-full rounded-xl mb-2 group-hover:scale-105 transition-transform">
              <span class="text-[11px] font-mono font-bold text-slate-200 block">Títulos y Remates</span>
              <span class="text-[10px] text-purple-400 font-mono">Pág. 92 · Judicial</span>
            </div>
            <div onclick="openEbookViewer(115)" class="cursor-pointer group bg-slate-950 p-2.5 rounded-2xl border border-slate-800 hover:border-amber-400 transition-all text-center">
              <img src="/assets/graphics/tomo-historico-449.webp" alt="Tomo 449" class="w-full rounded-xl mb-2 group-hover:scale-105 transition-transform">
              <span class="text-[11px] font-mono font-bold text-slate-200 block">Propiedad CNR</span>
              <span class="text-[10px] text-amber-400 font-mono">Pág. 115 · Marcas</span>
            </div>
            <div onclick="openEbookViewer(140)" class="cursor-pointer group bg-slate-950 p-2.5 rounded-2xl border border-slate-800 hover:border-cyan-400 transition-all text-center">
              <img src="/assets/graphics/tomo-historico-448.webp" alt="Tomo 448" class="w-full rounded-xl mb-2 group-hover:scale-105 transition-transform">
              <span class="text-[11px] font-mono font-bold text-slate-200 block">Balances y Avisos</span>
              <span class="text-[10px] text-cyan-400 font-mono">Pág. 140 · Mercantil</span>
            </div>
          </div>
        </div>

        <!-- Catálogo Visual de Clasificaciones Jurídicas -->
        <div>
          <h4 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <i class="fa-solid fa-layer-group text-brand-400"></i> Clasificador Jurídico Automático (7 Categorías Oficiales)
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
              Los edictos de aceptación de herencia (como el publicado en la <strong>Página 59</strong> por el Juzgado Quinto de lo Civil de Chinameca) confieren la <em>administración y representación definitiva de la sucesión</em> a los herederos declarados. Si consideras que tienes igual o mejor derecho hereditario, el edicto publicado en el Diario Oficial es la prueba legal para personarte ante el juez o notario.
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
        <span class="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">Cumplimiento LAIP Arts. 10 y 11 · Uso Informativo</span>
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
          Las transcripciones provienen de procesos automatizados (OCR) y se ofrecen «tal cual» con fines orientativos. <strong>Grupo Stu, S.A.S. no es responsable de la exactitud de la información contenida ni del uso, interpretación o decisiones tomadas por el usuario.</strong>
        </div>
      </div>
    </div>
  </main>

  <!-- ========================================================================= -->
  <!-- VISOR EBOOK HIPER-INTERACTIVO EN PANTALLA DIVIDIDA (PDF.JS + SYNC CLIC)   -->
  <!-- ========================================================================= -->
  <div id="modal-ebook" class="fixed inset-0 bg-slate-950/98 backdrop-blur-md hidden flex-col z-50">
    <!-- Barra Superior Principal del Visor -->
    <div class="min-h-[64px] bg-slate-900 border-b border-slate-800 px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
      <!-- Identificación del Tomo y Estado -->
      <div class="flex items-center gap-2.5">
        <img src="/assets/graphics/icono-sincronizacion-pdf.svg" alt="Sync PDF" class="w-9 h-9 rounded-lg">
        <div>
          <h4 class="text-xs sm:text-sm font-black text-white tracking-tight flex items-center gap-2 flex-wrap">
            <span>Diario Oficial · Tomo 453, N° 198 (23-10-2026)</span>
            <span id="ebook-top-page-badge" class="text-[11px] text-slate-950 bg-amber-400 px-2.5 py-0.5 rounded-md font-mono font-black">Pág. 59 de 164</span>
          </h4>
          <span class="text-[10px] text-slate-400 font-mono">Visor del documento con texto sincronizado</span>
        </div>
      </div>

      <!-- Controles de Paginación + Zoom + Buscador Interno + Siguiente Resaltado -->
      <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 font-mono text-xs">
        <!-- Paginación -->
        <button onclick="prevEbookPage()" title="Página anterior" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <div class="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700">
          <span class="text-[11px] text-slate-400">Pág.</span>
          <input type="number" id="ebook-page-number" value="59" min="1" max="164" onchange="jumpToEbookPage(this.value)"
            class="w-12 bg-slate-900 text-center text-brand-400 font-black outline-none rounded py-0.5">
          <span class="text-slate-500 text-[11px]">/ 164</span>
        </div>
        <button onclick="nextEbookPage()" title="Página siguiente" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700">
          <i class="fa-solid fa-chevron-right"></i>
        </button>

        <!-- Controles de Zoom -->
        <div class="flex items-center bg-slate-950 rounded-lg border border-slate-700 p-0.5">
          <button onclick="changePdfZoom(-0.2)" title="Reducir Zoom" class="px-2 py-1 hover:bg-slate-800 text-slate-300 rounded font-bold">-</button>
          <button onclick="setPdfZoom(1.0)" class="px-2 py-1 hover:bg-slate-800 text-slate-300 rounded text-[11px]">100%</button>
          <button onclick="setPdfZoom(1.25)" class="px-2 py-1 hover:bg-slate-800 text-brand-400 rounded text-[11px] font-bold">125%</button>
          <button onclick="setPdfZoom(1.5)" class="px-2 py-1 hover:bg-slate-800 text-amber-300 rounded text-[11px] font-bold">150%</button>
          <button onclick="changePdfZoom(0.2)" title="Aumentar Zoom" class="px-2 py-1 hover:bg-slate-800 text-slate-300 rounded font-bold">+</button>
        </div>

        <!-- Buscador Interno en Página Abierta -->
        <div class="relative flex items-center">
          <input type="text" id="ebook-inline-search" placeholder="Remarcar en página..."
            oninput="handleInlinePdfSearch(this.value)"
            class="w-36 sm:w-44 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg pl-2.5 pr-7 py-1.5 text-[11px] text-white outline-none font-mono">
          <i class="fa-solid fa-highlighter absolute right-2.5 text-amber-400 text-[11px]"></i>
        </div>

        <!-- Botón Ir al Siguiente Resaltado en Página -->
        <button onclick="focusNextPdfHighlight()" title="Saltar al siguiente texto remarcado en el PDF"
          class="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[11px] flex items-center gap-1.5">
          <i class="fa-solid fa-crosshairs"></i>
          <span class="hidden sm:inline">Siguiente Resaltado</span>
          <span id="pdf-highlight-counter" class="px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded font-black text-[10px]">0</span>
        </button>
      </div>

      <!-- Acciones de Certificación, Alternancia Nativa y Cierre -->
      <div class="flex items-center gap-1.5">
        <button onclick="openCertifiedCitationModal()" title="Generar Nota Informativa de Referencia Bibliográfica (Sin Valor Certificante)"
          class="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 text-[11px] font-black flex items-center gap-1.5 shadow-md shadow-brand-500/10">
          <i class="fa-solid fa-stamp"></i> <span class="hidden md:inline">Referencia Bibliográfica</span>
        </button>
        <button onclick="toggleNativePdfFallback()" id="btn-toggle-native-pdf" title="Alternar entre Motor Interactivo PDF.js y Vista Nativa del Navegador"
          class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold border border-slate-700 flex items-center gap-1">
          <i class="fa-solid fa-layer-group"></i> <span class="hidden xl:inline">Vista Nativa</span>
        </button>
        <a href="/pdf/23-10-2026.pdf" download="Diario_Oficial_Tomo_453_23_Octubre_2026.pdf" title="Descargar PDF Original Completo"
          class="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-700">
          <i class="fa-solid fa-download text-brand-400"></i> PDF
        </a>
        <button onclick="closeEbookViewer()" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-900/70 text-slate-300 hover:text-white flex items-center justify-center text-sm border border-slate-700">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>

    <!-- Aviso de página fuera de rango: ocupa su propia franja (no flota sobre el texto) y se oculta solo -->
    <div id="pdf-range-notice" role="status" aria-live="polite" aria-atomic="true" class="hidden flex-none px-4 py-2 bg-slate-950 border-b border-amber-400 text-amber-300 text-xs font-bold"></div>

    <!-- Cuerpo Dividido: Izquierda (Lienzo PDF.js + TextLayer + Radar) | Derecha (Transcripción Interactiva Sincronizada) -->
    <div class="flex-1 flex flex-col md:flex-row overflow-hidden relative">
      
      <!-- Indicador Flotante de Radar / Coincidencia Exacta -->
      <div id="pdf-floating-radar-badge" class="hidden fixed md:absolute bottom-4 md:bottom-auto md:top-4 left-4 right-4 md:right-auto z-50 pointer-events-nonebg-slate-950/95 border-2 border-amber-400 text-amber-300 px-4 py-2 rounded-2xl shadow-2xl font-mono text-xs font-bold flex items-center gap-2 animate-bounce">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
        <span id="pdf-floating-radar-text">📍 Localizado en Pág. 59 — Coincidencia Exacta</span>
      </div>

      <!-- LADO IZQUIERDO: Visor Interactivo PDF.js con Canvas HiDPI y TextLayer Resaltable -->
      <div id="pdf-interactive-scroll-container" class="flex-1 bg-slate-950/95 overflow-y-auto overflow-x-auto p-3 sm:p-6 border-r border-slate-800 relative text-center">
        <!-- Estado de carga del renderizador PDF.js -->
        <div id="pdf-loading-overlay" class="my-auto p-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-2">
          <i class="fa-solid fa-circle-notch fa-spin text-3xl text-brand-400"></i>
          <p class="text-xs font-mono text-slate-300">Renderizando página en alta definición y mapeando coordenadas de texto...</p>
        </div>

        <!-- Contenedor del Canvas + TextLayer de PDF.js -->
        <div id="pdf-page-wrapper" class="hidden">
          <canvas id="pdf-canvas"></canvas>
          <div id="pdf-text-layer" class="textLayer"></div>
        </div>

        <!-- Iframe de Resiliencia / Vista Nativa (oculto por defecto) -->
        <iframe id="ebook-pdf-frame" title="Vista nativa del PDF" class="hidden w-full h-full rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"></iframe>
      </div>

      <!-- LADO DERECHO: Panel de Transcripción Digitalizada e Hiper-Sincronizada -->
      <div id="ebook-side-panel" class="w-full md:w-[430px] lg:w-[490px] bg-slate-900/95 border-l border-slate-800 flex flex-col shrink-0">
        <div class="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
          <div>
            <h5 class="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <i class="fa-solid fa-file-contract text-brand-400"></i> Transcripción Digitalizada Sincronizada
            </h5>
            <span class="text-[11px] text-slate-400 font-mono">
              Haz clic en cualquier <span class="text-amber-300 font-bold">texto amarillo</span> o <span class="text-brand-300 font-bold">DUI</span> para enfocar en el PDF · Pág. <strong id="sidebar-page-label" class="text-white">59</strong>
            </span>
          </div>
          <button onclick="copyCurrentPageCitation()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-brand-400 font-bold flex items-center gap-1 border border-slate-700 shrink-0">
            <i class="fa-regular fa-copy"></i> Cita
          </button>
        </div>

        <div id="ebook-transcription-content" class="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono leading-relaxed text-slate-300">
          <!-- Renderizado dinámico con <mark class="highlight-clickable"> y chips de DUI -->
        </div>

        <div class="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span><i class="fa-solid fa-arrows-left-right text-amber-400 mr-1"></i> Sincronización Bidireccional Activa</span>
          <span class="text-brand-400 font-bold">LAIP Arts. 10 y 11</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- MODAL: REFERENCIA INFORMATIVA DE CITACIÓN (COPIAR)            -->
  <!-- ========================================================================= -->
  <div id="modal-certified-citation" class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm hidden items-center justify-center p-4 z-[60]">
    <div class="glass-card max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-amber-500/40 text-left space-y-4 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-3">
          <img src="/assets/graphics/sello-certificacion-stu.svg" alt="Sello" class="w-10 h-10">
          <div>
            <h3 class="text-base sm:text-lg font-black text-white">Nota Informativa de Referencia Bibliográfica</h3>
            <p class="text-[11px] font-mono text-amber-300">Guía Auxiliar de Ubicación (Tomo / Página) · Sin Valor Certificante Oficial</p>
          </div>
        </div>
        <button onclick="closeCertifiedCitationModal()" class="text-slate-400 hover:text-white text-lg"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <div id="certified-citation-body" class="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-200 space-y-2 leading-relaxed">
        <!-- Llenado dinámicamente -->
      </div>

      <div class="flex flex-wrap items-center justify-end gap-3 pt-2">
        <button onclick="copyCertifiedFichaText()" class="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-xs flex items-center gap-1.5">
          <i class="fa-regular fa-copy"></i> Copiar Referencia Bibliográfica
        </button>
        <button onclick="window.print()" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-1.5">
          <i class="fa-solid fa-print text-amber-400"></i> Imprimir Nota Informativa
        </button>
      </div>
    </div>
  </div>

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
    // =========================================================================
    // ESTADO GLOBAL DEL VISOR EBOOK PDF.JS Y SINCRONIZACIÓN BIDIRECCIONAL
    // =========================================================================
    let currentEbookPage = 59;
    let currentHighlightedTerm = '';
    let currentPageRecords = [];
    let pdfDocInstance = null;
    let currentPdfScale = 1.25;
    let pdfAjusteAncho = true; // se desactiva al usar los botones de zoom
    let isNativePdfMode = false;
    let currentPdfHighlightSpans = [];
    let currentPdfHighlightIndex = -1;
    let activeRenderTask = null;

    const DIGIT_WORDS = ['CERO', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];

    if (typeof window !== 'undefined' && window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

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
        <img src="\${st.icon}" alt="" class="w-4 h-4"> \${label}
      </span>\`;
    }

    function renderDuiChipsHtml(duis, pagina) {
      if (!duis || duis.length === 0) return '';
      return '<div class="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-2">' +
        '<span class="text-[11px] font-mono text-amber-400 font-bold flex items-center gap-1"><i class="fa-solid fa-fingerprint"></i> DUIs Identificados:</span>' +
        duis.map(dui => {
          const words = duiToNotarialWordsJS(dui);
          return \`<button type="button" onclick="openEbookViewer(\${pagina}, '\${dui}')" title="Clic para abrir el Visor Ebook en Pág. \${pagina} y localizar en el PDF: \${words}"
            class="group px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-500/40 text-xs font-mono font-black transition-all flex items-center gap-1.5 shadow-sm">
            <span>\${dui}</span>
            <span class="text-[10px] text-amber-200/80 group-hover:text-slate-900 font-normal hidden sm:inline">(\${words.split(' ').slice(0, 3).join(' ')}...)</span>
            <i class="fa-solid fa-crosshairs text-[10px]"></i>
          </button>\`;
        }).join('') +
      '</div>';
    }

    // Misma validación que el servidor (src/criterio.ts): DUI completo y válido, o nombre sin etiquetas ni símbolos.
    ${CRITERIO_CLIENT_JS}

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

    function copyCitation(text) {
      navigator.clipboard.writeText(text).then(() => {
        showFloatingRadar('✔ Cita legal copiada al portapapeles');
      });
    }

    function copyCurrentPageCitation() {
      const cit = 'Diario Oficial de El Salvador, Tomo 453, Número 198, Página ' + currentEbookPage + ' de 164 (Publicado el 23 de Octubre de 2026). Información de Dominio Público (LAIP Arts. 10 y 11).';
      copyCitation(cit);
    }

    function openCertifiedCitationModal() {
      const modal = document.getElementById('modal-certified-citation');
      const body = document.getElementById('certified-citation-body');
      const firstRec = currentPageRecords[0];
      const clasif = firstRec ? classifyLegalRecordJS(firstRec) : 'Publicación Oficial Gubernamental';
      const duisList = currentPageRecords.flatMap(r => r.duisEncontrados || []);
      body.innerHTML = \`
        <div class="text-amber-400 font-bold border-b border-slate-800 pb-1.5 mb-2">CERTIFICACIÓN DE REFERENCIA HEBDO-DOCUMENTAL (LAIP ARTS. 10 Y 11)</div>
        <div><strong>Órgano / Fuente Oficial:</strong> Diario Oficial de la República de El Salvador (Imprenta Nacional)</div>
        <div><strong>Datos de Edición:</strong> Tomo N° 453 · Diario N° 198 · Fecha: 23 de Octubre de 2026</div>
        <div><strong>Ubicación Exacta:</strong> Página <strong>\${currentEbookPage} de 164</strong></div>
        <div><strong>Clasificación Jurídica:</strong> \${clasif}</div>
        <div><strong>Término / DUI Verificado:</strong> \${currentHighlightedTerm || (duisList.length ? duisList.join(', ') : 'Consulta General de Hoja')}</div>
        <div><strong>URL Primaria Estatal:</strong> https://www.diariooficial.gob.sv/</div>
        <div class="text-[11px] text-emerald-400 pt-2 border-t border-slate-800">Referencia informativa indexada por Grupo Stu, S.A.S. No sustituye al Diario Oficial publicado por la imprenta nacional; verifique siempre en la fuente estatal.</div>
      \`;
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closeCertifiedCitationModal() {
      const modal = document.getElementById('modal-certified-citation');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    function copyCertifiedFichaText() {
      const text = document.getElementById('certified-citation-body').innerText;
      navigator.clipboard.writeText(text).then(() => {
        showFloatingRadar('✔ Nota informativa de referencia copiada al portapapeles');
      });
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

    // =========================================================================
    // MOTOR PDF.JS + RENDERIZADO HIDPI + TEXT LAYER + REMARCADO FLUORESCENTE
    // =========================================================================
    function normalizeForMatch(str) {
      return String(str || '')
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '')
        .toLowerCase();
    }

    function buildSearchTokensForPdf(term) {
      if (!term || !term.trim()) return [];
      const clean = term.trim();
      const digits = clean.replace(/\\D/g, '');
      const tokens = new Set();

      tokens.add(normalizeForMatch(clean));

      // Si es un DUI (8 o 9 dígitos), agregar formato numérico y secuencias de al menos 4 palabras del DUI
      if (digits.length >= 7 && digits.length <= 9) {
        const padded = digits.padStart(9, '0');
        const canonical = padded.slice(0, 8) + '-' + padded.slice(8);
        tokens.add(canonical);
        tokens.add(padded);
        const wordsStr = duiToNotarialWordsJS(canonical).toLowerCase();
        tokens.add(wordsStr);
        const wArr = padded.split('').map(d => DIGIT_WORDS[parseInt(d, 10)].toLowerCase());
        for (let i = 0; i <= wArr.length - 4; i++) {
          tokens.add(wArr.slice(i, i + 4).join(' '));
        }
        tokens.add(wArr.slice(5, 8).join(' ') + ' - ' + wArr[8]);
      } else {
        // Palabras individuales de >= 4 letras para nombres o términos jurídicos
        clean.split(/\\s+/).forEach(w => {
          const nw = normalizeForMatch(w);
          if (nw.length >= 4) tokens.add(nw);
        });
      }
      return Array.from(tokens).filter(Boolean);
    }

    async function ensurePdfLoaded() {
      if (pdfDocInstance) return pdfDocInstance;
      if (!window.pdfjsLib) throw new Error('PDF.js no disponible');
      const loadingTask = window.pdfjsLib.getDocument('/pdf/23-10-2026.pdf');
      pdfDocInstance = await loadingTask.promise;
      return pdfDocInstance;
    }

    async function renderPdfPageInteractive(pageNum, autoFocusHighlight = true) {
      const wrapper = document.getElementById('pdf-page-wrapper');
      const loadingOverlay = document.getElementById('pdf-loading-overlay');
      const frame = document.getElementById('ebook-pdf-frame');
      const canvas = document.getElementById('pdf-canvas');
      const textLayerDiv = document.getElementById('pdf-text-layer');

      if (isNativePdfMode) {
        wrapper.classList.add('hidden');
        loadingOverlay.classList.add('hidden');
        frame.classList.remove('hidden');
        frame.src = '/pdf/23-10-2026.pdf#page=' + pageNum;
        return;
      }

      frame.classList.add('hidden');
      loadingOverlay.classList.remove('hidden');

      try {
        const pdf = await ensurePdfLoaded();
        const page = await pdf.getPage(pageNum);
        // En pantallas angostas la página se ajusta al ancho disponible (salvo que la persona haya hecho zoom).
        let escala = currentPdfScale;
        if (pdfAjusteAncho && window.innerWidth < 768) {
          const ancho = (document.getElementById('pdf-interactive-scroll-container').clientWidth || window.innerWidth) - 24;
          escala = Math.max(0.3, ancho / page.getViewport({ scale: 1 }).width);
        }
        const viewport = page.getViewport({ scale: escala });
        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = Math.floor(viewport.width) + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';

        wrapper.style.width = Math.floor(viewport.width) + 'px';
        wrapper.style.height = Math.floor(viewport.height) + 'px';

        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (activeRenderTask) {
          try { activeRenderTask.cancel(); } catch (_) {}
        }
        activeRenderTask = page.render({ canvasContext: ctx, viewport });
        await activeRenderTask.promise;

        // Construir capa de coordenadas matemática 1:1 con el canvas usando viewport.convertToViewportRectangle
        textLayerDiv.innerHTML = '';
        textLayerDiv.style.width = Math.floor(viewport.width) + 'px';
        textLayerDiv.style.height = Math.floor(viewport.height) + 'px';

        const textContent = await page.getTextContent();
        window.__lastPdfTextItems = textContent.items || [];
        window.__lastPdfViewport = viewport;

        // Crear elementos posicionados con exactitud matemática milimétrica sobre cada línea del PDF
        (textContent.items || []).forEach((item, idx) => {
          if (!item.str || !item.str.trim()) return;
          const tx = item.transform; // [scaleX, skewY, skewX, scaleY, x, y]
          const fontHeight = Math.hypot(tx[2], tx[3]) || 10;
          const itemWidth = item.width || (item.str.length * fontHeight * 0.5);
          // En PDF las coordenadas (tx[4], tx[5]) son el origen inferior izquierdo de la línea de texto
          const rect = viewport.convertToViewportRectangle([
            tx[4],
            tx[5] - fontHeight * 0.18,
            tx[4] + itemWidth,
            tx[5] + fontHeight * 0.92
          ]);
          const left = Math.min(rect[0], rect[2]);
          const top = Math.min(rect[1], rect[3]);
          const width = Math.max(12, Math.abs(rect[2] - rect[0]));
          const height = Math.max(10, Math.abs(rect[3] - rect[1]));

          const span = document.createElement('span');
          span.textContent = item.str;
          span.dataset.itemIdx = String(idx);
          span.style.position = 'absolute';
          span.style.left = Math.round(left) + 'px';
          span.style.top = Math.round(top) + 'px';
          span.style.width = Math.round(width) + 'px';
          span.style.height = Math.round(height) + 'px';
          span.style.color = 'transparent';
          span.style.userSelect = 'text';
          span.style.pointerEvents = 'auto';
          textLayerDiv.appendChild(span);
        });

        loadingOverlay.classList.add('hidden');
        wrapper.classList.remove('hidden');

        // Aplicar remarcado fluorescente exacto en el PDF
        applyHighlightsOnPdfTextLayer(currentHighlightedTerm, autoFocusHighlight);
      } catch (err) {
        console.warn('Fallback a visor nativo:', err);
        loadingOverlay.classList.add('hidden');
        wrapper.classList.add('hidden');
        frame.classList.remove('hidden');
        frame.src = '/pdf/23-10-2026.pdf#page=' + pageNum;
      }
    }

    function applyHighlightsOnPdfTextLayer(term, autoScroll = true) {
      const textLayerDiv = document.getElementById('pdf-text-layer');
      const spans = Array.from(textLayerDiv.querySelectorAll('span'));
      currentPdfHighlightSpans = [];
      currentPdfHighlightIndex = -1;

      spans.forEach(s => {
        s.classList.remove('pdf-highlight-box', 'pdf-radar-focus');
      });

      const tokens = buildSearchTokensForPdf(term);
      if (tokens.length === 0) {
        document.getElementById('pdf-highlight-counter').innerText = '0';
        return;
      }

      spans.forEach((span, idx) => {
        const normSpan = normalizeForMatch(span.textContent || '');
        if (!normSpan || normSpan.length < 2) return;

        // Verificar coincidencia directa en el span o combinando con el span vecino (por saltos de línea del PDF)
        const nextNorm = idx + 1 < spans.length ? normalizeForMatch(spans[idx + 1].textContent || '') : '';
        const combined = normSpan + ' ' + nextNorm;

        const matched = tokens.some(tk => normSpan.includes(tk) || (tk.length >= 6 && combined.includes(tk)));
        if (matched) {
          span.classList.add('pdf-highlight-box');
          span.title = 'Coincidencia exacta en PDF · Clic para iluminar en la Transcripción Digitalizada';
          span.onclick = (ev) => {
            ev.stopPropagation();
            syncPdfClickToTranscription(span.textContent || term);
          };
          currentPdfHighlightSpans.push(span);
        }
      });

      document.getElementById('pdf-highlight-counter').innerText = String(currentPdfHighlightSpans.length);

      if (currentPdfHighlightSpans.length > 0 && autoScroll) {
        currentPdfHighlightIndex = 0;
        focusSpecificPdfSpan(currentPdfHighlightSpans[0], term);
      }
    }

    function focusSpecificPdfSpan(span, labelTerm) {
      if (!span) return;
      currentPdfHighlightSpans.forEach(s => s.classList.remove('pdf-radar-focus'));
      span.classList.add('pdf-radar-focus');
      span.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      showFloatingRadar('📍 Localizado en Pág. ' + currentEbookPage + ' — Coincidencia Exacta' + (labelTerm ? ' («' + labelTerm + '»)' : ''));
    }

    function focusNextPdfHighlight() {
      if (currentPdfHighlightSpans.length === 0) {
        showFloatingRadar('Ingresa un término o haz clic en un texto amarillo para resaltar en el PDF');
        return;
      }
      currentPdfHighlightIndex = (currentPdfHighlightIndex + 1) % currentPdfHighlightSpans.length;
      const target = currentPdfHighlightSpans[currentPdfHighlightIndex];
      focusSpecificPdfSpan(target, currentHighlightedTerm);
    }

    function showFloatingRadar(message) {
      const badge = document.getElementById('pdf-floating-radar-badge');
      const text = document.getElementById('pdf-floating-radar-text');
      text.innerText = message;
      badge.classList.remove('hidden');
      clearTimeout(window.__radarTimer);
      window.__radarTimer = setTimeout(() => {
        badge.classList.add('hidden');
      }, 4200);
    }

    // Sincronización Derecha -> Izquierda: Clic en <mark> o chip de DUI enfoca y hace auto-zoom en el PDF
    async function focusTermInPdfFromTranscription(term, pageNum) {
      const targetPage = parseInt(pageNum, 10) || currentEbookPage;
      currentHighlightedTerm = term;
      document.getElementById('ebook-inline-search').value = term;

      // Auto-zoom inteligente a 135% si estaba muy pequeño para lectura nítida del párrafo
      if (!pdfAjusteAncho && currentPdfScale < 1.25) {
        currentPdfScale = 1.35;
      }

      if (targetPage !== currentEbookPage) {
        currentEbookPage = targetPage;
        await updateEbookDisplay(true);
      } else {
        await renderPdfPageInteractive(currentEbookPage, true);
      }
    }

    // Sincronización Izquierda -> Derecha: Clic en un resaltado del PDF hace scroll hacia la tarjeta de transcripción
    function syncPdfClickToTranscription(snippetText) {
      const cards = Array.from(document.querySelectorAll('.ebook-record-card'));
      if (cards.length === 0) return;
      const norm = normalizeForMatch(snippetText);
      let targetCard = cards.find(c => normalizeForMatch(c.innerText).includes(norm)) || cards[0];
      cards.forEach(c => c.classList.remove('record-card-flash'));
      targetCard.classList.add('record-card-flash');
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showFloatingRadar('🔗 Párrafo sincronizado en la Transcripción Digitalizada');
    }

    function changePdfZoom(delta) {
      const next = Math.min(2.2, Math.max(0.75, Math.round((currentPdfScale + delta) * 100) / 100));
      setPdfZoom(next);
    }

    function setPdfZoom(scaleVal) {
      currentPdfScale = scaleVal;
      pdfAjusteAncho = false;
      renderPdfPageInteractive(currentEbookPage, false);
    }

    function toggleNativePdfFallback() {
      isNativePdfMode = !isNativePdfMode;
      const btn = document.getElementById('btn-toggle-native-pdf');
      btn.innerHTML = isNativePdfMode
        ? '<i class="fa-solid fa-wand-magic-sparkles text-amber-400"></i> <span class="hidden xl:inline">Motor PDF.js</span>'
        : '<i class="fa-solid fa-layer-group"></i> <span class="hidden xl:inline">Vista Nativa</span>';
      renderPdfPageInteractive(currentEbookPage, true);
    }

    function handleInlinePdfSearch(val) {
      currentHighlightedTerm = val.trim();
      applyHighlightsOnPdfTextLayer(currentHighlightedTerm, true);
      renderTranscriptionCards(currentPageRecords);
    }

    // Visor Oficial Ebook
    function openEbookViewer(pageNum, highlightTerm) {
      currentEbookPage = parseInt(pageNum, 10) || 1;
      currentHighlightedTerm = highlightTerm !== undefined ? highlightTerm : (document.getElementById('query-input')?.value?.trim() || '');
      document.getElementById('ebook-inline-search').value = currentHighlightedTerm;

      const modal = document.getElementById('modal-ebook');
      modal.classList.remove('hidden');
      modal.classList.add('flex');

      updateEbookDisplay(true);
    }

    function closeEbookViewer() {
      const modal = document.getElementById('modal-ebook');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    function prevEbookPage() {
      if (currentEbookPage > 1) {
        currentEbookPage--;
        updateEbookDisplay(true);
      }
    }

    function nextEbookPage() {
      if (currentEbookPage < 164) {
        currentEbookPage++;
        updateEbookDisplay(true);
      }
    }

    function jumpToEbookPage(val) {
      const p = parseInt(val, 10);
      if (p >= 1 && p <= 164) {
        currentEbookPage = p;
        updateEbookDisplay(true);
      } else {
        // Fuera de rango: se restaura la página actual en el campo y se avisa
        document.getElementById('ebook-page-number').value = currentEbookPage;
        showPageRangeNotice('El tomo tiene páginas de la 1 a la 164.');
      }
    }

    // Aviso accesible (aria-live) en franja propia: no tapa contenido y desaparece a los 3 s
    function showPageRangeNotice(message) {
      const box = document.getElementById('pdf-range-notice');
      box.textContent = message;
      box.classList.remove('hidden');
      clearTimeout(window.__rangeTimer);
      window.__rangeTimer = setTimeout(() => {
        box.classList.add('hidden');
        box.textContent = '';
      }, 3000);
    }

    function buildInteractiveHighlightedHtml(content, term, pageNum) {
      if (!term || !term.trim()) return content;
      const cleanDigits = term.replace(/\\D/g, '');
      const wordMap = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
      let wordsPattern = '';
      if (cleanDigits.length >= 7 && cleanDigits.length <= 9) {
        const padded = cleanDigits.padStart(9, '0');
        const wordsList = padded.split('').map(d => wordMap[parseInt(d, 10)]);
        wordsPattern = wordsList.slice(0, 8).join('\\\\s+') + '\\\\s*[-–—\\\\s]+\\\\s*' + wordsList[8];
      }
      const escapedTerm = term.replace(/[.*+?^()|[\\]\\\\]/g, '\\\\$&');
      const patterns = [
        escapedTerm,
        cleanDigits.length >= 7 ? cleanDigits : null,
        wordsPattern ? wordsPattern : null
      ].filter(Boolean);

      const safeTerm = term.replace(/'/g, "\\\\'");
      try {
        const regex = new RegExp('(' + patterns.join('|') + ')', 'gi');
        return content.replace(
          regex,
          \`<mark onclick="focusTermInPdfFromTranscription('\${safeTerm}', \${pageNum})" title="Clic para localizar y enfocar en el PDF original (Pág. \${pageNum})" class="highlight-clickable">$1</mark>\`
        );
      } catch (_) {
        return content;
      }
    }

    function selectArticleCardAndFocusPdf(idx, anchorPhrase, pageNum) {
      activeArticleIndex = idx;
      document.querySelectorAll('.ebook-record-card').forEach((el, i) => {
        if (i === idx) {
          el.classList.add('border-brand-500', 'ring-1', 'ring-brand-500/40');
        } else {
          el.classList.remove('border-brand-500', 'ring-1', 'ring-brand-500/40');
        }
      });
      const rec = currentPageRecords[idx];
      // Si el artículo tiene un DUI propio o un término activo, o usamos las palabras clave del titular/inicio del artículo
      let focusTarget = currentHighlightedTerm;
      if (!focusTarget || (rec && !rec.contenido.toLowerCase().includes(focusTarget.toLowerCase()))) {
        if (rec && rec.duisEncontrados && rec.duisEncontrados.length > 0) {
          focusTarget = rec.duisEncontrados[0];
        } else {
          focusTarget = anchorPhrase.split(/\s+/).slice(0, 4).join(' ');
        }
      }
      focusTermInPdfFromTranscription(focusTarget, pageNum);
    }

    function renderTranscriptionCards(records) {
      const transBox = document.getElementById('ebook-transcription-content');
      if (!records || records.length === 0) {
        transBox.innerHTML = \`
          <div class="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-center space-y-2">
            <i class="fa-solid fa-file-pdf text-2xl text-brand-400"></i>
            <p class="font-bold text-white">Página \${currentEbookPage} de 164 · Vista Facsimilar</p>
            <p class="text-[11px] text-slate-400">El motor PDF.js a la izquierda ha cargado la capa de texto completa de la página \${currentEbookPage}. Usa el buscador superior para remarcar cualquier palabra directamente sobre el PDF.</p>
          </div>\`;
        return;
      }

      // Primero los registros que coinciden con la búsqueda (texto o DUI), para no hacer desplazar al usuario.
      const qTerm = String(currentHighlightedTerm || '').toLowerCase().trim();
      const qDigits = qTerm.replace(/[^0-9]/g, '');
      const hits = (r) => !!qTerm && ((r.contenido || '').toLowerCase().includes(qTerm) || (qDigits.length >= 6 && (r.duisEncontrados || []).some(d => String(d).replace(/[^0-9]/g, '').includes(qDigits))));
      records = records.slice().sort((a, b) => (hits(b) ? 1 : 0) - (hits(a) ? 1 : 0));

      transBox.innerHTML = records.map(rec => {
        const clasif = classifyLegalRecordJS(rec);
        const highlightedContent = buildInteractiveHighlightedHtml(rec.contenido, currentHighlightedTerm, rec.pagina);
        const duisChips = (rec.duisEncontrados && rec.duisEncontrados.length > 0)
          ? '<div class="pt-2.5 border-t border-slate-800/90 flex flex-wrap items-center gap-1.5">' +
              '<span class="text-[10px] text-amber-400 font-bold"><i class="fa-solid fa-fingerprint mr-1"></i>DUIs Identificados (Clic para enfocar en PDF):</span>' +
              rec.duisEncontrados.map(d => {
                const w = duiToNotarialWordsJS(d);
                return \`<button type="button" onclick="focusTermInPdfFromTranscription('\${d}', \${rec.pagina})" title="Clic para localizar y enfocar en el PDF original: \${w}"
                  class="px-2 py-0.5 rounded bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/40 text-[11px] font-black transition-all cursor-pointer">
                  \${d} <i class="fa-solid fa-location-crosshairs ml-0.5 text-[10px]"></i>
                </button>\`;
              }).join('') +
            '</div>'
          : '';

        return \`
          <div class="ebook-record-card p-4 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 transition-all text-left space-y-2.5">
            <div class="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-800 pb-2">
              \${getLegalClassificationBadge(clasif)}
              <span class="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Tomo \${rec.tomo} · N° \${rec.numero} · Pág. \${rec.pagina} de 164
              </span>
            </div>
            <h6 class="font-bold text-white text-xs leading-snug">\${rec.titular}</h6>
            <div class="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line">\${highlightedContent}</div>
            \${duisChips}
          </div>\`;
      }).join('');
    }

    async function updateEbookDisplay(autoFocus = true) {
      document.getElementById('ebook-page-number').value = currentEbookPage;
      document.getElementById('sidebar-page-label').innerText = currentEbookPage;
      document.getElementById('ebook-top-page-badge').innerText = 'Pág. ' + currentEbookPage + ' de 164';

      const transBox = document.getElementById('ebook-transcription-content');
      transBox.innerHTML = '<div class="p-4 rounded-xl bg-slate-950 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-brand-400 mr-2"></i> Sincronizando transcripción de Pág. ' + currentEbookPage + '...</div>';

      // Disparar renderizado PDF.js y consulta O(1) de registros en paralelo
      renderPdfPageInteractive(currentEbookPage, autoFocus);

      fetch('/api/v1/page-data/' + currentEbookPage)
        .then(r => r.json())
        .then(data => {
          currentPageRecords = data.records || [];
          renderTranscriptionCards(currentPageRecords);
        })
        .catch(() => {
          transBox.innerHTML = '<div class="p-3 text-rose-300">Error al cargar transcripción.</div>';
        });
    }

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

    // Búsqueda General y DUI con Tarjetas Enriquecidas
    function searchDiario(e) {
      if (e) e.preventDefault();
      const q = document.getElementById('query-input').value.trim();
      const cat = document.getElementById('category-filter').value;
      const forceDui = document.getElementById('force-dui-check').checked;
      const resContainer = document.getElementById('results-container');
      const btn = document.getElementById('btn-search');
      const avisoEl = document.getElementById('search-aviso');
      avisoEl.classList.add('hidden');

      if (q.length === 0) {
        avisoEl.innerText = 'Escribe un DUI o un nombre para buscar en el archivo.';
        avisoEl.classList.remove('hidden');
        resContainer.innerHTML = '';
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Consultando Archivo...';
      resContainer.innerHTML = '<div class="glass-card p-10 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-3xl text-brand-400"></i><p class="mt-3 text-sm font-mono">Buscando en publicaciones oficiales y sumarios jurídicos...</p></div>';

      const url = '/api/v1/search?q=' + encodeURIComponent(q) + 
                  (cat ? '&categoria=' + encodeURIComponent(cat) : '') +
                  (forceDui ? '&forceDui=1' : '');

      fetch(url)
        .then(r => r.json())
        .then(data => {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Consultar Archivo Oficial';
          if (data.aviso) {
            avisoEl.innerText = data.aviso;
            avisoEl.classList.remove('hidden');
          }

          if (data.entradaInvalida) {
            // Entrada inválida (DUI incompleto o con verificador erróneo, texto muy corto): nunca se dice «sin publicaciones».
            resContainer.innerHTML = '<div role="alert" class="glass-card p-6 rounded-3xl text-center border border-amber-500/40"><i class="fa-solid fa-triangle-exclamation text-3xl text-amber-400 mb-2"></i><h4 class="text-base font-bold text-white">Revisa lo que escribiste</h4><p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">' + (data.aviso || 'La consulta no es válida.') + ' Todavía no se hizo una consulta confiable, así que no podemos decir si aparece o no en el archivo.</p></div>';
            return;
          }

          if (!data.results || data.results.length === 0) {
            resContainer.innerHTML = \`
              <div class="glass-card p-8 sm:p-10 rounded-3xl text-center text-slate-400 border border-slate-800">
                <i class="fa-regular fa-circle-check text-4xl text-brand-400 mb-3"></i>
                <h4 class="text-base sm:text-lg font-bold text-white">Sin publicaciones oficiales encontradas</h4>
                <p class="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                  El criterio «<strong>\${escapeHtmlText(q)}</strong>» no registra edictos judiciales, avisos de rebeldía ni embargos publicados en este tomo.
                </p>
                <div class="mt-5">
                  <button onclick="openModalAlert()" class="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-brand-400 font-bold text-xs hover:bg-slate-800">
                    <i class="fa-solid fa-bell"></i> Activar alerta preventiva por si se publica en el futuro &rarr;
                  </button>
                </div>
              </div>\`;
            return;
          }

          resContainer.innerHTML = data.results.map(item => {
            const d = item.diario;
            const clasif = classifyLegalRecordJS(d);
            const citation = \`Diario Oficial Tomo \${d.tomo}, N° \${d.numero}, Pág. \${d.pagina} de 164 (\${d.fecha})\`;
            const isDuiMatch = d.duisEncontrados && d.duisEncontrados.length > 0;
            const safeQ = (data.duiNormalized || q).replace(/'/g, "\\\\'");

            return \`
            <div class="glass-card p-5 sm:p-7 rounded-3xl border \${isDuiMatch ? 'border-brand-500/50 bg-brand-950/10' : 'border-slate-800'} hover:border-brand-500/70 transition-all text-left">
              <!-- Fila Superior de Badges Destacados: Clasificación Jurídica + Página Exacta + Tomo + Número + Fecha -->
              <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div class="flex flex-wrap items-center gap-2">
                  \${getLegalClassificationBadge(clasif)}
                  <span onclick="openEbookViewer(\${d.pagina}, '\${safeQ}')" class="cursor-pointer text-xs font-mono font-black px-3 py-1 rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shadow-sm flex items-center gap-1.5">
                    <i class="fa-solid fa-file-lines"></i> Pág. \${d.pagina} de 164
                  </span>
                  <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200">
                    Tomo \${d.tomo} · N° \${d.numero} · \${d.fecha}
                  </span>
                </div>
                <button onclick="copyCitation('\${citation}')" title="Copiar cita jurídica certificada" class="text-xs text-slate-400 hover:text-white font-mono flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                  <i class="fa-regular fa-copy text-brand-400"></i> Copiar Cita
                </button>
              </div>

              <h4 class="text-base sm:text-lg font-bold text-white mb-2.5">\${d.titular}</h4>

              <!-- Extracto con fragmento remarcado interactivo -->
              <div class="text-xs sm:text-sm font-mono text-slate-300 leading-relaxed bg-slate-950/85 p-4 rounded-2xl border border-slate-800/80 mb-3 whitespace-pre-line">\${item.snippet}</div>

              <!-- Chips interactivos de DUIs Identificados (numérico + letras notariales) -->
              \${renderDuiChipsHtml(d.duisEncontrados, d.pagina)}

              <div class="flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-800/80 pt-3 mt-3">
                <div class="flex flex-wrap items-center gap-3">
                  <button onclick="openEbookViewer(\${d.pagina}, '\${safeQ}')" class="bg-brand-500 hover:bg-brand-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-brand-500/20">
                    <i class="fa-solid fa-book-open-reader"></i> Abrir en Visor Ebook y Remarcar en PDF (Pág. \${d.pagina})
                  </button>
                  <a href="/pdf/23-10-2026.pdf#page=\${d.pagina}" download="Diario_Oficial_23_Octubre_2026_GrupoStu.pdf" class="text-slate-400 hover:text-white font-bold flex items-center gap-1">
                    <i class="fa-solid fa-download"></i> PDF Original
                  </a>
                </div>
                <a href="https://www.diariooficial.gob.sv/" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5">
                  Fuente Estatal: diariooficial.gob.sv <i class="fa-solid fa-arrow-up-right-from-square text-[11px]"></i>
                </a>
              </div>
            </div>\`;
          }).join('');
        })
        .catch(() => {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Consultar Archivo Oficial';
          resContainer.innerHTML = '<div class="p-4 rounded-xl bg-rose-950 text-rose-300 text-sm">Error de conexión al consultar el archivo oficial.</div>';
        });
    }

    // Buscador de Marcas
    function searchMarcas(e) {
      if (e) e.preventDefault();
      const q = document.getElementById('marca-query')?.value?.trim() || '';
      const clase = document.getElementById('marca-clase')?.value || '';
      const container = document.getElementById('marcas-results-container');

      container.innerHTML = '<div class="col-span-2 p-8 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-2xl text-cyan-400"></i><p class="mt-2 text-xs">Cargando catálogo oficial de marcas registradas...</p></div>';

      fetch('/api/v1/marcas?q=' + encodeURIComponent(q) + (clase ? '&clase=' + encodeURIComponent(clase) : ''))
        .then(r => r.json())
        .then(data => {
          if (!data.marcas || data.marcas.length === 0) {
            container.innerHTML = '<div class="col-span-2 glass-card p-8 rounded-3xl text-center text-slate-400">No se encontraron marcas para este criterio.</div>';
            return;
          }
          container.innerHTML = data.marcas.map(m => \`
            <div class="glass-card p-5 sm:p-6 rounded-3xl border border-slate-800 hover:border-cyan-500/50 transition-all text-left flex flex-col justify-between">
              <div>
                <div class="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <span class="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">Clase Niza \${m.claseNiza}</span>
                  <span class="text-xs font-mono font-black px-2.5 py-0.5 rounded bg-amber-400 text-slate-950">Pág. \${m.pagina} de 164 · Tomo \${m.tomo}</span>
                </div>
                <h4 class="text-base font-black text-white mb-1">\${m.denominacion}</h4>
                <p class="text-xs text-slate-400 font-mono mb-2"><strong>Titular:</strong> \${m.titular}</p>
                <p class="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-3">\${m.claseDescripcion}</p>
              </div>
              <div class="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                <span class="font-mono">Exp: \${m.expediente} (\${m.fechaPublicacion})</span>
                <button onclick="openEbookViewer(\${m.pagina}, '\${m.denominacion}')" class="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1">
                  <i class="fa-solid fa-book-open"></i> Remarcar en Ebook (Pág. \${m.pagina}) <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </button>
              </div>
            </div>
          \`).join('');
        })
        .catch(() => {
          container.innerHTML = '<div class="col-span-2 p-4 text-center text-rose-300">Error al cargar marcas.</div>';
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
                  <span onclick="openEbookViewer(\${e.pagina}, '\${firstDui}')" class="cursor-pointer px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black">
                    Pág. \${e.pagina} de 164
                  </span>
                </div>
                <span class="font-bold text-slate-300">Tomo \${e.tomo} · N° \${e.numero} · \${e.fecha}</span>
              </div>
              <h4 class="text-sm font-bold text-white mb-1.5">\${e.titular}</h4>
              <p class="text-xs text-slate-300 line-clamp-3 leading-relaxed font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800/70">\${e.contenido}</p>
              \${renderDuiChipsHtml(e.duisEncontrados, e.pagina)}
              <div class="mt-3 text-right">
                <button onclick="openEbookViewer(\${e.pagina}, '\${firstDui}')" class="text-xs text-brand-400 hover:underline font-bold inline-flex items-center gap-1.5">
                  <i class="fa-solid fa-book-open-reader"></i> Abrir en Lector Ebook Interactivo (Pág. \${e.pagina}) &rarr;
                </button>
              </div>
            </div>\`;
          }).join('');
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
                  <span class="px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black">Pág. \${l.pagina} de 164</span>
                </div>
                <span class="font-bold text-slate-300">Tomo \${l.tomo} · N° \${l.numero} · \${l.fecha}</span>
              </div>
              <h4 class="text-sm font-bold text-white mb-2">\${l.titular}</h4>
              <p class="text-xs text-slate-300 line-clamp-4 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 mb-2 font-mono">\${l.contenido}</p>
              <div class="text-right">
                <button onclick="openEbookViewer(\${l.pagina}, 'Decreto')" class="text-xs text-cyan-400 hover:underline font-bold inline-flex items-center gap-1.5">
                  <i class="fa-solid fa-book-open-reader"></i> Ver texto de ley en Visor Ebook (Pág. \${l.pagina}) &rarr;
                </button>
              </div>
            </div>\`;
          }).join('');
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
      quickSearchDemo('Decreto No. 690');
    });
  </script>
</body>
</html>`;
}
