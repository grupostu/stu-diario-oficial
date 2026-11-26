import { MASTER_FOOTER_HTML } from './master-footer.js';
import { escapeHtml as esc } from './html.js';
import { THEME_BOOT } from './pagina_base.js';
import { VISOR_HTML } from './visor_cliente.js';
import { ACTIVO_CSS, ACTIVO_JS } from './portada_activos.js';
import { PORTADA_CSS } from './portada_css.js';
import { PORTADA_JS } from './portada_js.js';
import type { Diario } from './diarios.js';

export interface OpcionesPortal {
  /** true: CSS y JS como archivos estáticos con huella (lo que sirve el servidor); false: en línea (HTML autocontenido, útil en pruebas). */
  externalizarActivos?: boolean;
}

function bloqueEstilos(o: OpcionesPortal): string {
  return o.externalizarActivos ? `<link rel="stylesheet" href="${ACTIVO_CSS.url}">` : `<style>\n${PORTADA_CSS}\n  </style>`;
}

function bloqueScript(o: OpcionesPortal): string {
  return o.externalizarActivos ? `<script src="${ACTIVO_JS.url}"></script>` : `<script>\n${PORTADA_JS}\n  </script>`;
}

export function renderPortal(stats: { totalDocumentos: number; totalAlertas: number; diarios: Diario[] }, opciones: OpcionesPortal = {}): string {
  const diarios = stats.diarios;
  const ultimo = diarios.length ? diarios[diarios.length - 1]! : null;
  const etiquetaDiario = (d: Diario): string => `Tomo ${d.tomo} · N.° ${d.numero} · ${d.fecha.split('-').reverse().join('-')}`;
  return `<!DOCTYPE html>
<html lang="es" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diarios Oficiales de El Salvador · Busca edictos, marcas y leyes por DUI o nombre</title>
  <meta name="description" content="Busca tu DUI, tu nombre o el de tu empresa en los edictos, marcas y leyes del Diario Oficial de El Salvador y consulta el PDF original.">
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
  ${bloqueEstilos(opciones)}
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
      <h1 class="text-2xl sm:text-4xl font-bold text-gs-text tracking-tight leading-tight">Diario Oficial de El Salvador: consulta de publicaciones</h1>
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
          <i class="fa-solid fa-bell"></i> Ver estado de alertas
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
          <span>Términos de Uso, Naturaleza Informativa y Descargo Legal de Responsabilidad — Grupo Stu, S.A.S. de C.V.</span>
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
          <strong>Grupo Stu, S.A.S. de C.V.</strong> es una entidad privada e independiente; no representa ni sustituye a la Imprenta Nacional (<code>diariooficial.gob.sv</code>) ni emite certificaciones, constancias oficiales o copias fieles con valor probatorio judicial.
        </div>
        <div class="bg-gs-surface p-3.5 rounded-xl border border-gs-border">
          <strong class="text-gs-warning block mb-1">3. Limitación Total de Responsabilidad:</strong>
          Las transcripciones se extraen automáticamente del texto del PDF y se ofrecen «tal cual» con fines orientativos. <strong>Grupo Stu, S.A.S. de C.V. no es responsable de la exactitud de la información contenida ni del uso, interpretación o decisiones tomadas por el usuario.</strong>
        </div>
      </div>
    </div>
  </main>

  ${VISOR_HTML}

  <!-- Modal informativo: las alertas aún no están disponibles y no se recopilan datos. -->
  <div id="modal-alert" class="fixed inset-0 bg-gs-bg hidden items-center justify-center p-4 z-50" aria-hidden="true">
    <div class="glass-card max-w-md w-full p-6 sm:p-8 rounded-xl border border-gs-border text-left" role="dialog" aria-modal="true" aria-labelledby="alert-modal-title" tabindex="-1">
      <div class="flex justify-between items-center mb-4">
        <h3 id="alert-modal-title" class="text-xl font-bold text-gs-text flex items-center gap-2">
          <i class="fa-solid fa-bell text-gs-accent"></i> Alertas por correo
        </h3>
        <button type="button" aria-label="Cerrar" onclick="closeModalAlert()" class="text-gs-text2 hover:text-gs-text text-lg"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <p class="text-sm text-gs-text2 mb-6 leading-relaxed" role="status">
        El servicio de alertas por correo está temporalmente deshabilitado. No ingreses ni envíes datos personales aquí; esta ventana no recopila ni guarda información.
      </p>
      <a href="/privacidad" class="text-gs-accent underline">Leer el aviso de privacidad</a>
    </div>
  </div>

  ${MASTER_FOOTER_HTML}

  <script type="module" src="/stu-ui/cabecera/cabecera.js?v=1"></script>
  ${bloqueScript(opciones)}
</body>
</html>`;
}
