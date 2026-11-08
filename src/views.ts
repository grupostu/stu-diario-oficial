export function renderPortal(stats: { totalDocumentos: number; totalAlertas: number }): string {
  return `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diarios Oficiales de El Salvador · Consulta Jurídica, Visor Ebook, Edictos, Marcas y Alertas por DUI | diariosoficiales.grupostu.com</title>
  <meta name="description" content="Archivo digital, visor interactivo Ebook, motor de búsqueda de DUI, edictos judiciales y marcas registradas en el Diario Oficial de El Salvador. Información de pleno dominio público (LAIP Arts. 10 y 11).">
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
  <style>
    body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    .glass { background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); }
    .glass-card { background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
    .gradient-text { background: linear-gradient(135deg, #34d399 0%, #38bdf8 50%, #818cf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .tab-btn.active { background: #10b981; color: #020617; font-weight: 800; border-color: #10b981; }
    mark.highlight { background-color: #facc15; color: #020617; font-weight: 800; padding: 2px 4px; border-radius: 4px; }
  </style>
</head>
<body class="bg-dark-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-brand-500 selection:text-slate-950">

  <!-- Cintillo de Deslinde, Transparencia y Fuentes Gubernamentales Oficiales -->
  <div class="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 text-xs py-2 px-4 text-center text-slate-400">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
      <span><i class="fa-solid fa-scale-balanced text-brand-400 mr-1.5"></i> REPUBLICA DE EL SALVADOR · ARCHIVO CÍVICO DE DIARIOS OFICIALES</span>
      <div class="flex items-center gap-3">
        <span>Fuente Primaria Oficial: <a href="https://www.diariooficial.gob.sv/" target="_blank" rel="noopener noreferrer" class="text-brand-400 hover:underline">diariooficial.gob.sv</a> · <a href="https://www.imprentanacional.gob.sv/" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:underline">Imprenta Nacional</a></span>
        <span class="text-slate-500">|</span>
        <span class="text-slate-300">Dominio Público: <strong>LAIP Arts. 10 y 11</strong></span>
      </div>
    </div>
  </div>

  <!-- Header Institucional -->
  <header class="border-b border-slate-800/80 bg-slate-950/90 sticky top-0 z-40 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      <div class="flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-500 via-emerald-600 to-cyan-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-brand-500/20">
          <i class="fa-solid fa-book-bookmark text-slate-950"></i>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-black text-white text-lg tracking-tight">DIARIOS OFICIALES</span>
            <span class="text-brand-400 font-extrabold text-xs tracking-wider uppercase px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">DE EL SALVADOR</span>
          </div>
          <p class="text-[11px] text-slate-400 font-mono tracking-wide">
            diariosoficiales.grupostu.com <span class="text-slate-600">|</span> Inteligencia Jurídica, Visor Ebook y Alertas por DUI
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button onclick="openEbookViewer(59)" class="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-brand-300 font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2">
          <i class="fa-solid fa-book-open-reader text-brand-400"></i> Abrir Lector Ebook Oficial
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
        <span><strong class="text-white">164</strong> Páginas Digitalizadas en Servidores Grupo Stu</span>
        <span><strong class="text-brand-400">0%</strong> Rastro de Privacidad (Zero-Logs)</span>
      </div>
      <div class="flex items-center gap-2 text-emerald-400 font-bold">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Servidor Soberano Activo
      </div>
    </div>
  </div>

  <!-- Contenedor Principal -->
  <main class="flex-1 max-w-5xl mx-auto px-4 py-8 sm:py-10 w-full">
    
    <!-- Hero Principal -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold uppercase tracking-wider mb-3">
        <i class="fa-solid fa-shield-halved"></i> Prevención de Juicios en Rebeldía y Protección Patrimonial
      </div>
      <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
        Consulta y Notificaciones del <span class="gradient-text">Diario Oficial de El Salvador</span>
      </h1>
      <p class="mt-3 text-slate-300 text-xs sm:text-base max-w-3xl mx-auto leading-relaxed">
        Verifica al instante si tu <strong>DUI</strong>, <strong>Nombre</strong> o <strong>Razón Social</strong> figura en edictos judiciales de emplazamiento, declaratorias de herederos, sentencias penales, embargos o registros de marcas del CNR.
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
      <button onclick="switchTab('faq')" id="tab-btn-faq" class="tab-btn px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white text-xs sm:text-sm font-medium flex items-center gap-2 transition-all">
        <i class="fa-solid fa-circle-question"></i> Guía Ciudadana y Respuestas
      </button>
    </div>

    <!-- ========================================================================= -->
    <!-- TAB 1: BUSCADOR GENERAL Y DUI -->
    <!-- ========================================================================= -->
    <div id="tab-content-dui" class="space-y-6">
      <div class="glass-card p-5 sm:p-7 rounded-3xl border border-slate-800 shadow-2xl">
        <form onsubmit="searchDiario(event)" class="space-y-4">
          <div>
            <div class="relative">
              <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
              <input type="text" id="query-input" placeholder="Ingresa DUI (ej. 00356274-2 o 003562742), Nombre Completo o Persona..." required
                oninput="handleDuiInputPreview(this.value)"
                class="w-full bg-slate-950/90 border border-slate-700 focus:border-brand-500 rounded-2xl pl-11 pr-4 py-4 text-white text-sm outline-none font-mono">
            </div>

            <!-- Badge dinámico de detección y normalización de DUI -->
            <div id="dui-preview-badge" class="hidden mt-2 p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/30 text-xs font-mono text-brand-300 flex items-center justify-between">
              <span id="dui-preview-text"></span>
              <span class="text-[10px] text-slate-400">Normalización digital a formato canónico 00000000-0</span>
            </div>
          </div>
          
          <div class="flex flex-col sm:flex-row gap-3">
            <select id="category-filter" class="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-slate-300 text-xs sm:text-sm outline-none font-medium">
              <option value="">Todas las Secciones del Diario Oficial</option>
              <option value="EDICTO_JUDICIAL">Edictos Judiciales y Notariales (Herederos, Emplazamientos)</option>
              <option value="REGISTRO_MARCA">Registro de Marcas y Patentes (CNR)</option>
              <option value="DECRETO_LEGISLATIVO">Decretos de la Asamblea Legislativa</option>
              <option value="SUBASTA_EMBARGO">Subastas, Embargos y Remates Públicos</option>
              <option value="ACUERDO_EJECUTIVO">Acuerdos Ejecutivos y Reglamentos</option>
            </select>

            <div class="flex items-center gap-2 bg-slate-950 px-4 py-3 rounded-2xl border border-slate-700">
              <input type="checkbox" id="force-dui-check" class="rounded text-brand-500 focus:ring-0 bg-slate-900 border-slate-600">
              <label for="force-dui-check" class="text-xs text-slate-300 select-none cursor-pointer">Filtrar exclusivamente por DUI</label>
            </div>

            <button type="submit" id="btn-search" class="bg-brand-500 hover:bg-brand-400 text-slate-950 font-black px-8 py-3.5 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shrink-0">
              <i class="fa-solid fa-bolt"></i> Consultar Archivo Oficial
            </button>
          </div>
        </form>
      </div>

      <!-- Resultados Dinámicos -->
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
          <div class="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
            <i class="fa-solid fa-trademark"></i>
          </div>
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
        <div>
          <h3 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-gavel text-brand-400"></i> Últimos Edictos Judiciales y Notariales
          </h3>
          <p class="text-xs text-slate-400">Publicaciones recientes de declaratorias de herederos, juicios civiles y mercantiles de El Salvador.</p>
        </div>
        <button onclick="loadRecentEdictos()" class="text-xs text-brand-400 font-bold hover:underline flex items-center gap-1">
          <i class="fa-solid fa-rotate-right"></i> Recargar
        </button>
      </div>
      <div id="edictos-recientes-container" class="space-y-3">
        <!-- Renderizado por JS -->
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- TAB 4: LEYES Y DECRETOS OFICIALES -->
    <!-- ========================================================================= -->
    <div id="tab-content-leyes" class="hidden space-y-4">
      <div class="glass-card p-6 rounded-3xl border border-slate-800">
        <h3 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-landmark text-cyan-400"></i> Decretos Legislativos y Amnistías Recientes
        </h3>
        <p class="text-xs text-slate-400 mt-1">Normas legales promulgadas y publicadas en el Diario Oficial de la República de El Salvador.</p>
      </div>
      <div id="leyes-recientes-container" class="space-y-3">
        <!-- Renderizado por JS -->
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- TAB 5: GUÍA CIUDADANA Y PREGUNTAS CLAVE -->
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
              En El Salvador, cuando un juzgado civil, mercantil o de sentencia no encuentra a una persona demandada o imputada, la ley ordena emplazarla por <strong>edicto en el Diario Oficial</strong>. Si no te presentas con tu abogado en el plazo concedido (usualmente 10 días hábiles), el tribunal te declara formalmente en <strong>calidad de rebeldía</strong> y dicta sentencia condenatoria o embargo ejecutivo sin que hayas ejercido tu derecho de defensa. Monitorear esta plataforma te permite enterarte a tiempo y apersonarte.
            </p>
          </div>

          <div class="bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
            <h4 class="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
              <span class="text-cyan-400">02.</span> ¿Cómo reclamar o verificar una herencia si vi a un familiar en un edicto?
            </h4>
            <p class="text-xs text-slate-300 leading-relaxed">
              Los edictos de aceptación de herencia (como el publicado en la <strong>Página 59</strong> por el Juzgado Quinto de lo Civil de Chinameca) confieren la <em>administración y representación definitiva de la sucesión</em> a los herederos declarados. Si consideras que tienes igual o mejor derecho hereditario (como hijo, cónyuge o cesionario), el edicto publicado en el Diario Oficial es la prueba legal para personarte ante el juez o notario y solicitar tu inclusión antes de que se adjudiquen los bienes.
            </p>
          </div>

          <div class="bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
            <h4 class="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
              <span class="text-amber-400">03.</span> ¿Cómo saber si una empresa está registrando tu marca o signo comercial?
            </h4>
            <p class="text-xs text-slate-300 leading-relaxed">
              El Centro Nacional de Registros (CNR) publica en el Diario Oficial las solicitudes de marcas en trámite. A partir de la publicación, la <em>Ley de Marcas y Otros Signos Distintivos</em> otorga un <strong>plazo fatal de 30 días hábiles</strong> para que terceros presenten su escrito de oposición formal. Si dejas pasar el plazo sin revisar la gaceta oficial, el CNR otorga el registro exclusivo a quien lo solicitó.
            </p>
          </div>

          <div class="bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
            <h4 class="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
              <span class="text-emerald-400">04.</span> ¿Por qué los PDFs están alojados en Grupo Stu y cómo se garantiza la autenticidad?
            </h4>
            <p class="text-xs text-slate-300 leading-relaxed">
              Las páginas de la Imprenta Nacional y del Gobierno sufren caídas de servicio o devuelven errores 404 en enlaces profundos. Para garantizar un acceso ininterrumpido 24/7, Grupo Stu digitaliza y aloja réplicas exactas de los PDFs oficiales en servidores soberanos de alta velocidad, enlazando siempre con la cita oficial verificable y los portales estatales <code>diariooficial.gob.sv</code> e <code>imprentanacional.gob.sv</code>.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Escudo y Blindaje Legal (LAIP Arts. 10 y 11) -->
    <div class="mt-8 p-6 rounded-2xl border border-slate-800 bg-slate-950/70 text-xs text-slate-400 leading-relaxed text-left">
      <div class="flex items-center gap-2 text-slate-300 font-bold mb-2">
        <i class="fa-solid fa-scale-balanced text-brand-400"></i>
        <span>Marco Jurídico de Transparencia, Dominio Público y Blindaje Institucional</span>
      </div>
      <p>
        <strong>1. Pleno Dominio Público (LAIP Arts. 10 y 11):</strong> De conformidad con los Artículos 10 y 11 de la <em>Ley de Acceso a la Información Pública</em> de El Salvador, las leyes, decretos, reglamentos, edictos judiciales, carteles notariales y resoluciones divulgados en el Diario Oficial tienen el carácter legal de <strong>información oficiosa de libre consulta y de pleno dominio público</strong>.
      </p>
      <p class="mt-2">
        <strong>2. Independencia Tecnológica y Deslinde de Responsabilidad:</strong> Esta plataforma es un servicio independiente de indexación, analítica y monitoreo cívico desarrollado y operado por <strong>Grupo Stu, S.A.S.</strong> <strong>NO es una entidad gubernamental</strong>, no pertenece a la Dirección de Publicaciones e Impresos ni sustituye los trámites judiciales o registrales oficiales. La fuente originaria de consulta es accesible en los portales oficiales <code>diariooficial.gob.sv</code> e <code>imprentanacional.gob.sv</code>.
      </p>
    </div>
  </main>

  <!-- ========================================================================= -->
  <!-- MODAL / VISOR EBOOK PROFESIONAL INTERACTIVO (SIN SALIR DE LA PLATAFORMA) -->
  <!-- ========================================================================= -->
  <div id="modal-ebook" class="fixed inset-0 bg-slate-950/95 backdrop-blur-md hidden flex-col z-50">
    <!-- Barra Superior de Control del Ebook -->
    <div class="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-brand-500 text-slate-950 flex items-center justify-center font-bold text-sm">
          <i class="fa-solid fa-book-open"></i>
        </div>
        <div>
          <h4 class="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span>Diario Oficial · Tomo 453, N° 198 (23 de Octubre de 2026)</span>
            <span class="text-[10px] text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 font-mono">EDICIÓN COMPLETA (164 PÁGS)</span>
          </h4>
          <span class="text-[11px] text-slate-400 font-mono">Alojado en Servidores Grupo Stu · Fuente: diariooficial.gob.sv</span>
        </div>
      </div>

      <!-- Controles de Navegación Tipo Ebook -->
      <div class="flex items-center gap-2 sm:gap-4 font-mono text-xs">
        <button onclick="prevEbookPage()" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 flex items-center gap-1">
          <i class="fa-solid fa-chevron-left"></i> <span class="hidden sm:inline">Anterior</span>
        </button>
        <div class="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700">
          <span>Pág.</span>
          <input type="number" id="ebook-page-number" value="1" min="1" max="164" onchange="jumpToEbookPage(this.value)"
            class="w-12 bg-slate-900 text-center text-brand-400 font-bold outline-none rounded py-0.5">
          <span class="text-slate-500">/ 164</span>
        </div>
        <button onclick="nextEbookPage()" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 flex items-center gap-1">
          <span class="hidden sm:inline">Siguiente</span> <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      <!-- Acciones Rápidas -->
      <div class="flex items-center gap-2">
        <a href="/pdf/23-10-2026.pdf" download="Diario_Oficial_23_Octubre_2026_GrupoStu.pdf" title="Descargar PDF Original (3.80 MB)"
          class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700">
          <i class="fa-solid fa-download text-brand-400"></i> Descargar PDF
        </a>
        <a href="https://www.diariooficial.gob.sv/" target="_blank" rel="noopener noreferrer" title="Ir al Portal Oficial de El Salvador"
          class="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> Portal Estatal
        </a>
        <button onclick="closeEbookViewer()" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white flex items-center justify-center text-sm border border-slate-700">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>

    <!-- Cuerpo del Lector Dividido (PDF Original a la izquierda, Transcripción Digitalizada y Resaltada a la derecha) -->
    <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
      <!-- Visor PDF Original -->
      <div class="flex-1 bg-slate-950 p-2 sm:p-4 flex flex-col items-center justify-center border-r border-slate-800 relative">
        <iframe id="ebook-pdf-frame" src="/pdf/23-10-2026.pdf#page=1" class="w-full h-full rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"></iframe>
      </div>

      <!-- Panel Lateral de Transcripción Digitalizada y Sincronizada -->
      <div class="w-full md:w-96 lg:w-[440px] bg-slate-900/90 border-l border-slate-800 flex flex-col shrink-0">
        <div class="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h5 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <i class="fa-solid fa-file-lines text-brand-400"></i> Transcripción Digitalizada
            </h5>
            <span class="text-[11px] text-slate-400 font-mono">Indexación exacta sincronizada con la Pág. <strong id="sidebar-page-label" class="text-white">1</strong></span>
          </div>
          <button onclick="copyCurrentPageCitation()" class="text-xs text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1">
            <i class="fa-regular fa-copy"></i> Cita
          </button>
        </div>

        <div id="ebook-transcription-content" class="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono leading-relaxed text-slate-300">
          <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-center">
            Cargando transcripción digital de la página...
          </div>
        </div>

        <div class="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>Fuente: Imprenta Nacional SV</span>
          <span class="text-brand-400">Soberanía Grupo Stu</span>
        </div>
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
      <form onsubmit="submitAlert(event)" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">DUI o Nombre a Monitorear</label>
          <input type="text" id="alert-criterion" placeholder="ej. 00356274-2 o Nombre Completo" required
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
        <button type="submit" class="w-full bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-400 hover:to-cyan-400 text-slate-950 font-black py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-brand-500/20">
          Guardar Alerta y Proteger mi Identidad
        </button>
      </form>
    </div>
  </div>

  <footer class="border-t border-slate-800/80 bg-slate-950/90 py-8 text-center text-xs text-slate-400">
    <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-brand-400"></span>
        <span class="font-bold text-white">Diarios Oficiales de El Salvador</span>
        <span>· Plataforma Cívica y Tecnológica</span>
      </div>
      <div>
        <span>Desarrollado y operado por <strong>Grupo Stu, S.A.S.</strong></span>
      </div>
    </div>
  </footer>

  <script>
    let currentEbookPage = 1;
    let currentHighlightedTerm = '';

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
        alert('✔ Cita jurídica oficial copiada: ' + text);
      });
    }

    function copyCurrentPageCitation() {
      const cit = 'Diario Oficial de El Salvador, Tomo 453, Número 198, Página ' + currentEbookPage + ' (Publicado el 23 de Octubre de 2026). Digitalizado por Grupo Stu, S.A.S.';
      copyCitation(cit);
    }

    // Previsualizador dinámico de DUI mientras el usuario escribe
    function handleDuiInputPreview(val) {
      const badge = document.getElementById('dui-preview-badge');
      const text = document.getElementById('dui-preview-text');
      const clean = val.replace(/\\D/g, '');

      if (clean.length >= 6 && clean.length <= 9) {
        const padded = clean.padStart(9, '0');
        const formatted = padded.slice(0, 8) + '-' + padded.slice(8);
        text.innerHTML = '<i class="fa-solid fa-fingerprint text-brand-400 mr-1.5"></i> DUI Detectado: <strong class="text-white">' + formatted + '</strong>';
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    // Visor Oficial Ebook
    function openEbookViewer(pageNum, highlightTerm) {
      currentEbookPage = parseInt(pageNum, 10) || 1;
      currentHighlightedTerm = highlightTerm || document.getElementById('query-input')?.value?.trim() || '';

      const modal = document.getElementById('modal-ebook');
      modal.classList.remove('hidden');
      modal.classList.add('flex');

      updateEbookDisplay();
    }

    function closeEbookViewer() {
      const modal = document.getElementById('modal-ebook');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    function prevEbookPage() {
      if (currentEbookPage > 1) {
        currentEbookPage--;
        updateEbookDisplay();
      }
    }

    function nextEbookPage() {
      if (currentEbookPage < 164) {
        currentEbookPage++;
        updateEbookDisplay();
      }
    }

    function jumpToEbookPage(val) {
      const p = parseInt(val, 10);
      if (p >= 1 && p <= 164) {
        currentEbookPage = p;
        updateEbookDisplay();
      }
    }

    function updateEbookDisplay() {
      document.getElementById('ebook-page-number').value = currentEbookPage;
      document.getElementById('sidebar-page-label').innerText = currentEbookPage;

      // Actualizar el frame PDF
      const frame = document.getElementById('ebook-pdf-frame');
      frame.src = '/pdf/23-10-2026.pdf#page=' + currentEbookPage;

      // Cargar transcripción digitalizada de esa página
      const transBox = document.getElementById('ebook-transcription-content');
      transBox.innerHTML = '<div class="p-4 rounded-xl bg-slate-950 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-brand-400 mr-2"></i> Cargando transcripción de la página ' + currentEbookPage + '...</div>';

      fetch('/api/v1/page-data/' + currentEbookPage)
        .then(r => r.json())
        .then(data => {
          if (!data.records || data.records.length === 0) {
            transBox.innerHTML = \`
              <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-center">
                <i class="fa-solid fa-file-pdf text-2xl text-slate-600 mb-2"></i>
                <p>Página \${currentEbookPage} digitalizada en el archivo general.</p>
                <p class="text-[11px] text-slate-500 mt-1">Consulta el visor PDF original a la izquierda para inspeccionar el texto facsímil.</p>
              </div>\`;
            return;
          }

          transBox.innerHTML = data.records.map(rec => {
            let highlightedContent = rec.contenido;
            if (currentHighlightedTerm) {
              const cleanDigits = currentHighlightedTerm.replace(/\\D/g, '');
              const wordMap = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
              let wordsPattern = '';
              if (cleanDigits.length === 9) {
                const wordsList = cleanDigits.split('').map(d => wordMap[parseInt(d, 10)]);
                wordsPattern = wordsList.slice(0, 8).join('\\\\s+') + '\\\\s*[-–—\\\\s]*\\\\s*' + wordsList[8];
              }
              const patterns = [
                currentHighlightedTerm,
                cleanDigits ? cleanDigits : null,
                wordsPattern ? wordsPattern : null
              ].filter(Boolean);

              try {
                const regex = new RegExp('(' + patterns.join('|') + ')', 'gi');
                highlightedContent = highlightedContent.replace(regex, '<mark class="highlight">$1</mark>');
              } catch (e) {
                // fallback
              }
            }

            return \`
              <div class="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2">
                <div class="flex items-center justify-between text-[11px] text-brand-400 font-bold border-b border-slate-800 pb-1.5">
                  <span>\${rec.categoria}</span>
                  <span class="text-slate-500">Tomo \${rec.tomo}, Pág. \${rec.pagina}</span>
                </div>
                <h6 class="font-bold text-white text-xs">\${rec.titular}</h6>
                <div class="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line">\${highlightedContent}</div>
                \${rec.duisEncontrados && rec.duisEncontrados.length > 0 ? 
                  '<div class="pt-2 border-t border-slate-800 text-[11px] text-amber-300 font-bold"><i class="fa-solid fa-fingerprint mr-1"></i>DUIs Identificados: ' + rec.duisEncontrados.join(', ') + '</div>' : ''}
              </div>\`;
          }).join('');
        })
        .catch(() => {
          transBox.innerHTML = '<div class="p-3 text-rose-300">Error al cargar transcripción.</div>';
        });
    }

    // Cambio de pestañas
    function switchTab(tabId) {
      const tabs = ['dui', 'marcas', 'recientes', 'leyes', 'faq'];
      tabs.forEach(t => {
        const btn = document.getElementById('tab-btn-' + t);
        const content = document.getElementById('tab-content-' + t);
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

    // Búsqueda General y DUI
    function searchDiario(e) {
      if (e) e.preventDefault();
      const q = document.getElementById('query-input').value.trim();
      const cat = document.getElementById('category-filter').value;
      const forceDui = document.getElementById('force-dui-check').checked;
      const resContainer = document.getElementById('results-container');
      const btn = document.getElementById('btn-search');

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
          
          if (!data.results || data.results.length === 0) {
            resContainer.innerHTML = \`
              <div class="glass-card p-8 sm:p-10 rounded-3xl text-center text-slate-400 border border-slate-800">
                <i class="fa-regular fa-circle-check text-4xl text-brand-400 mb-3"></i>
                <h4 class="text-base sm:text-lg font-bold text-white">Sin publicaciones oficiales encontradas</h4>
                <p class="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                  El criterio «<strong>\${q}</strong>» no registra edictos judiciales, avisos de rebeldía ni embargos publicados recientemente.
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
            const citation = \`Diario Oficial Tomo \${item.diario.tomo}, N° \${item.diario.numero}, Pág. \${item.diario.pagina} (\${item.diario.fecha})\`;
            const isDuiMatch = item.diario.duisEncontrados && item.diario.duisEncontrados.length > 0;
            return \`
            <div class="glass-card p-5 sm:p-7 rounded-3xl border \${isDuiMatch ? 'border-brand-500/50 bg-brand-950/10' : 'border-slate-800'} hover:border-brand-500/60 transition-all text-left">
              <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono px-3 py-1 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-400 font-bold">\${item.diario.categoria}</span>
                  \${isDuiMatch ? '<span class="text-xs font-mono px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold"><i class="fa-solid fa-fingerprint mr-1"></i>DUI Detectado: ' + item.diario.duisEncontrados.join(', ') + '</span>' : ''}
                </div>
                <span class="text-xs text-slate-400 font-mono flex items-center gap-2">
                  <span>\${citation}</span>
                  <button onclick="copyCitation('\${citation}')" title="Copiar cita jurídica" class="text-slate-500 hover:text-white"><i class="fa-regular fa-copy"></i></button>
                </span>
              </div>
              <h4 class="text-base sm:text-lg font-bold text-white mb-2.5">\${item.diario.titular}</h4>
              <div class="text-xs sm:text-sm font-mono text-slate-300 leading-relaxed bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 mb-4 whitespace-pre-line">\${item.snippet}</div>
              <div class="flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-800/80 pt-3">
                <div class="flex items-center gap-3">
                  <button onclick="openEbookViewer(\${item.diario.pagina}, '\${q}')" class="bg-brand-500 hover:bg-brand-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-brand-500/10">
                    <i class="fa-solid fa-book-open"></i> Abrir en Lector Ebook (Pág. \${item.diario.pagina})
                  </button>
                  <a href="/pdf/23-10-2026.pdf" download="Diario_Oficial_23_Octubre_2026_GrupoStu.pdf" class="text-slate-400 hover:text-white font-bold flex items-center gap-1">
                    <i class="fa-solid fa-download"></i> PDF (3.80 MB)
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
                <div class="flex items-center justify-between gap-2 mb-2">
                  <span class="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">Clase Niza \${m.claseNiza}</span>
                  <span class="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">\${m.estado}</span>
                </div>
                <h4 class="text-base font-black text-white mb-1">\${m.denominacion}</h4>
                <p class="text-xs text-slate-400 font-mono mb-2"><strong>Titular:</strong> \${m.titular}</p>
                <p class="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-3">\${m.claseDescripcion}</p>
              </div>
              <div class="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                <span class="font-mono">Exp: \${m.expediente} (Pág. \${m.pagina})</span>
                <button onclick="openEbookViewer(\${m.pagina}, '\${m.denominacion}')" class="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1">
                  <i class="fa-solid fa-book-open"></i> Ver en Ebook <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </button>
              </div>
            </div>
          \`).join('');
        })
        .catch(() => {
          container.innerHTML = '<div class="col-span-2 p-4 text-center text-rose-300">Error al cargar marcas.</div>';
        });
    }

    // Cargar últimos edictos
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
          container.innerHTML = data.edictos.map(e => \`
            <div class="glass-card p-4 sm:p-5 rounded-2xl border border-slate-800 text-left">
              <div class="flex justify-between items-center text-xs text-slate-400 font-mono mb-1.5">
                <span class="text-brand-400 font-bold">\${e.titular}</span>
                <span>Tomo \${e.tomo}, Pág. \${e.pagina} (\${e.fecha})</span>
              </div>
              <p class="text-xs text-slate-300 line-clamp-3 leading-relaxed">\${e.contenido}</p>
              <div class="mt-2 text-right">
                <button onclick="openEbookViewer(\${e.pagina})" class="text-xs text-brand-400 hover:underline font-bold flex items-center gap-1 ml-auto">
                  <i class="fa-solid fa-book-open"></i> Abrir en Lector Ebook (Pág. \${e.pagina}) &rarr;
                </button>
              </div>
            </div>
          \`).join('');
        });
    }

    // Cargar decretos y leyes
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
          container.innerHTML = data.leyes.map(l => \`
            <div class="glass-card p-5 rounded-2xl border border-slate-800 text-left">
              <div class="flex justify-between items-center text-xs text-slate-400 font-mono mb-2">
                <span class="text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20">Decreto Legislativo</span>
                <span>Pág. \${l.pagina} (\${l.fecha})</span>
              </div>
              <h4 class="text-sm font-bold text-white mb-2">\${l.titular}</h4>
              <p class="text-xs text-slate-300 line-clamp-4 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 mb-2">\${l.contenido}</p>
              <div class="text-right">
                <button onclick="openEbookViewer(\${l.pagina})" class="text-xs text-cyan-400 hover:underline font-bold flex items-center gap-1 ml-auto">
                  <i class="fa-solid fa-book-open"></i> Ver texto de ley en Lector Ebook &rarr;
                </button>
              </div>
            </div>
          \`).join('');
        });
    }

    function submitAlert(e) {
      e.preventDefault();
      const crit = document.getElementById('alert-criterion').value.trim();
      const email = document.getElementById('alert-email').value.trim();
      const phone = document.getElementById('alert-phone').value.trim();

      fetch('/api/v1/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          criterioBusqueda: crit,
          tipoCriterio: /\\b\\d{8}-\\d\\b/.test(crit) ? 'DUI' : 'NOMBRE',
          usuarioEmail: email,
          telefonoWhatsapp: phone
        })
      })
      .then(r => r.json())
      .then(() => {
        closeModalAlert();
        alert('✔ Alerta preventiva activada con éxito. Te notificaremos si detectamos publicaciones oficiales para «' + crit + '».');
      })
      .catch(() => {
        alert('Error al registrar la alerta.');
      });
    }
  </script>
</body>
</html>`;
}
