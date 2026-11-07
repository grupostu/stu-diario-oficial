export function renderPortal(stats: { totalDocumentos: number; totalAlertas: number }): string {
  return `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diarios Oficiales de El Salvador · Portal Jurídico y Alertas por DUI | diariosoficiales.grupostu.com</title>
  <meta name="description" content="Archivo digital, motor de búsqueda y sistema de alerta preventiva por DUI en los Diarios Oficiales de El Salvador. Información oficiosa y de pleno dominio público (LAIP Arts. 10 y 11).">
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
  </style>
</head>
<body class="bg-dark-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-brand-500 selection:text-slate-950">

  <!-- Barra Superior de Transparencia y Dominio Público -->
  <div class="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 text-xs py-1.5 px-4 text-center text-slate-400">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
      <span><i class="fa-solid fa-scale-balanced text-brand-400 mr-1.5"></i> REPUBLICA DE EL SALVADOR · ARCHIVO DIGITAL DE DIARIOS OFICIALES</span>
      <span class="text-slate-300">Dominio Público Conforme a la <strong>Ley de Acceso a la Información Pública (LAIP Art. 10 y 11)</strong></span>
    </div>
  </div>

  <!-- Header Institucional de Alta Autoridad -->
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
            diariosoficiales.grupostu.com <span class="text-slate-600">|</span> Inteligencia Jurídica y Notificaciones Preventivas
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button onclick="openModalAlert()" class="bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-400 hover:to-cyan-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2">
          <i class="fa-solid fa-bell"></i> Vigilancia por DUI / Nombre
        </button>
      </div>
    </div>
  </header>

  <!-- Métricas Rápidas del Archivo Oficial -->
  <div class="border-b border-slate-800/60 bg-slate-950/40 py-3">
    <div class="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center sm:justify-between gap-4 text-xs font-mono text-slate-400">
      <div class="flex items-center gap-6">
        <span><strong class="text-white">+165,000</strong> Publicaciones Oficiales</span>
        <span><strong class="text-white">+42,000</strong> Edictos Judiciales</span>
        <span><strong class="text-brand-400">0%</strong> Rastro de Privacidad (Zero-Logs)</span>
      </div>
      <div>
        <span class="inline-flex items-center gap-1.5 text-emerald-400">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Indexador en Vivo
        </span>
      </div>
    </div>
  </div>

  <!-- Contenedor Principal -->
  <main class="flex-1 max-w-5xl mx-auto px-4 py-12 w-full">
    <!-- Hero y Propuesta de Valor Cívico-Legal -->
    <div class="text-center mb-10">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold uppercase tracking-wider mb-4">
        <i class="fa-solid fa-shield-halved"></i> Prevención de Juicios en Rebeldía y Protección Patrimonial
      </div>
      <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
        Consulta y Notificaciones del <span class="gradient-text">Diario Oficial de El Salvador</span>
      </h1>
      <p class="mt-4 text-slate-300 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
        Verifica al instante si tu <strong>DUI</strong>, <strong>Nombre</strong> o <strong>Sociedad Mercantil</strong> ha sido mencionado en edictos de emplazamiento, sentencias penales, embargos, balances o registros de marca publicados en la gaceta oficial.
      </p>
    </div>

    <!-- Buscador Avanzado Estilo Legal Intelligence -->
    <div class="glass-card p-5 sm:p-7 rounded-3xl border border-slate-800 mb-8 shadow-2xl">
      <form onsubmit="searchDiario(event)" class="space-y-4">
        <div class="relative">
          <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
          <input type="text" id="query-input" placeholder="Ingresa número de DUI (ej. 02444983-6), NIT, Nombre Completo o Marca..." required
            class="w-full bg-slate-950/90 border border-slate-700 focus:border-brand-500 rounded-2xl pl-11 pr-4 py-4 text-white text-sm outline-none font-mono">
        </div>
        
        <div class="flex flex-col sm:flex-row gap-3">
          <select id="category-filter" class="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-slate-300 text-sm outline-none font-medium">
            <option value="">Todas las Publicaciones y Secciones</option>
            <option value="EDICTO_JUDICIAL">Edictos Judiciales (Emplazamientos / Sentencias / Rebeldías)</option>
            <option value="REGISTRO_MARCA">Registro de Marcas y Patentes (CNR)</option>
            <option value="SUBASTA_EMBARGO">Subastas, Embargos y Remates Públicos</option>
            <option value="DECRETO_LEGISLATIVO">Decretos de la Asamblea Legislativa</option>
            <option value="ACUERDO_EJECUTIVO">Acuerdos Ejecutivos y Reglamentos</option>
            <option value="BALANCE_FINANCIERO">Balances y Estados Financieros Auditados</option>
          </select>
          <button type="submit" id="btn-search" class="bg-brand-500 hover:bg-brand-400 text-slate-950 font-black px-8 py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shrink-0">
            <i class="fa-solid fa-bolt"></i> Consultar Archivo Oficial
          </button>
        </div>
      </form>
    </div>

    <!-- Contenedor de Resultados -->
    <div id="results-container" class="space-y-4">
      <!-- Dinámico vía JS -->
    </div>

    <!-- Sección de Concientización: El Peligro de los Juicios en Rebeldía -->
    <div class="mt-12 glass-card p-6 sm:p-8 rounded-3xl border border-amber-500/20 bg-amber-950/10 text-left">
      <div class="flex items-start gap-4">
        <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 text-lg">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <div>
          <h3 class="text-base font-bold text-white mb-1.5">¿Por qué es vital monitorear el Diario Oficial en El Salvador?</h3>
          <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
            De acuerdo con la legislación procesal penal y civil salvadoreña, cuando los juzgados no localizan a una persona demandada o imputada en su dirección física, la ley ordena notificarla mediante <strong>edictos publicados en el Diario Oficial</strong>. Si transcurre el plazo legal sin apersonarse, el proceso continúa y se dictan <strong>sentencias condenatorias en calidad de rebeldía</strong> sin que la persona haya ejercido su legítimo derecho de defensa.
          </p>
          <div class="mt-3">
            <button onclick="openModalAlert()" class="text-brand-400 hover:text-brand-300 text-xs font-bold underline flex items-center gap-1.5">
              <i class="fa-solid fa-bell"></i> Activa tu alerta gratuita para recibir un aviso si tu DUI aparece publicado &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Marco Legal Institucional y Deslinde de Responsabilidad -->
    <div class="mt-10 p-6 rounded-2xl border border-slate-800 bg-slate-950/70 text-xs text-slate-400 leading-relaxed text-left">
      <div class="flex items-center gap-2 text-slate-300 font-bold mb-2">
        <i class="fa-solid fa-scale-balanced text-brand-400"></i>
        <span>Fundamento Legal: Ley de Acceso a la Información Pública (LAIP) y Términos Cívicos</span>
      </div>
      <p>
        1. <strong>Naturaleza de Dominio Público:</strong> De conformidad con los Artículos 10 y 11 de la <strong>Ley de Acceso a la Información Pública (LAIP)</strong> de la República de El Salvador, las leyes, decretos legislativos, reglamentos ejecutivos, edictos judiciales, convocatorias y estados contables publicados en el Diario Oficial constituyen <em>información oficiosa de libre consulta y de pleno dominio público</em>.
      </p>
      <p class="mt-2">
        2. <strong>Independencia y No Suplantación:</strong> Este portal es una plataforma tecnológica de analítica, indexación y vigilancia cívica desarrollada y mantenida por <strong>Grupo Stu, S.A.S.</strong> de forma independiente. <strong>NO constituye un portal gubernamental</strong>, no pertenece a la Dirección de la Imprenta Nacional ni pretende reemplazar su función pública oficial. Todos los enlaces a documentos originales remiten a <code>diariooficial.gob.sv</code>.
      </p>
    </div>
  </main>

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
        Nuestro sistema revisa cada edición del Diario Oficial. Si detecta tu número de DUI, nombre o razón social en un edicto judicial, embargo o registro de marca, recibirás un aviso inmediato.
      </p>
      <form onsubmit="submitAlert(event)" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">DUI o Nombre a Vigilar</label>
          <input type="text" id="alert-criterion" placeholder="ej. 02444983-6 o Tu Nombre Completo" required
            class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none font-mono focus:border-brand-500">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">Correo Electrónico para Avisos</label>
          <input type="email" id="alert-email" placeholder="tu-correo@ejemplo.com" required
            class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-500">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">WhatsApp de Notificación Rápida (Opcional)</label>
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
        <span>· Plataforma de Inteligencia Cívica</span>
      </div>
      <div>
        <span>Desarrollado y mantenido con soberanía tecnológica por <strong>Grupo Stu, S.A.S.</strong></span>
      </div>
    </div>
  </footer>

  <script>
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
        alert('✔ Cita jurídica copiada al portapapeles: ' + text);
      });
    }

    function searchDiario(e) {
      e.preventDefault();
      const q = document.getElementById('query-input').value.trim();
      const cat = document.getElementById('category-filter').value;
      const resContainer = document.getElementById('results-container');
      const btn = document.getElementById('btn-search');

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Consultando Archivo...';
      resContainer.innerHTML = '<div class="p-8 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-2xl text-brand-400"></i><p class="mt-2 text-xs">Consultando base de datos oficial indexada...</p></div>';

      fetch('/api/v1/search?q=' + encodeURIComponent(q) + (cat ? '&categoria=' + encodeURIComponent(cat) : ''))
        .then(r => r.json())
        .then(data => {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Consultar Archivo Oficial';
          if (!data.results || data.results.length === 0) {
            resContainer.innerHTML = \`
              <div class="glass-card p-8 rounded-3xl text-center text-slate-400 border border-slate-800">
                <i class="fa-regular fa-circle-check text-4xl text-brand-400 mb-3"></i>
                <h4 class="text-base font-bold text-white">Sin publicaciones oficiales encontradas</h4>
                <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  El criterio «<strong>\${q}</strong>» no registra edictos judiciales, avisos de rebeldía ni embargos publicados recientemente.
                </p>
                <div class="mt-4">
                  <button onclick="openModalAlert()" class="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-brand-400 font-bold text-xs hover:bg-slate-800">
                    <i class="fa-solid fa-bell"></i> Activar alerta preventiva por si se publica en el futuro &rarr;
                  </button>
                </div>
              </div>\`;
            return;
          }

          resContainer.innerHTML = data.results.map(item => {
            const citation = \`Diario Oficial Tomo \${item.diario.tomo}, N° \${item.diario.numero}, Pág. \${item.diario.pagina} (\${item.diario.fecha})\`;
            return \`
            <div class="glass-card p-5 sm:p-7 rounded-3xl border border-slate-800 hover:border-brand-500/50 transition-all text-left">
              <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span class="text-xs font-mono px-3 py-1 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-400 font-bold">\${item.diario.categoria}</span>
                <span class="text-xs text-slate-400 font-mono flex items-center gap-2">
                  <span>\${citation}</span>
                  <button onclick="copyCitation('\${citation}')" title="Copiar cita jurídica" class="text-slate-500 hover:text-white"><i class="fa-regular fa-copy"></i></button>
                </span>
              </div>
              <h4 class="text-base sm:text-lg font-bold text-white mb-2.5">\${item.diario.titular}</h4>
              <p class="text-xs sm:text-sm font-mono text-slate-300 leading-relaxed bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 mb-4">\${item.snippet}</p>
              <div class="flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-800/80 pt-3">
                <span class="text-slate-400">Gaceta Oficial · República de El Salvador</span>
                <a href="\${item.diario.pdfUrlOficial}" target="_blank" rel="noopener noreferrer" class="text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1.5">
                  Descargar Documento Oficial (PDF) <i class="fa-solid fa-arrow-up-right-from-square text-[11px]"></i>
                </a>
              </div>
            </div>\`;
          }).join('');
        })
        .catch(() => {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Consultar Archivo Oficial';
          resContainer.innerHTML = '<div class="p-4 rounded-xl bg-rose-950 text-rose-300 text-sm">Error al consultar el servicio de búsqueda.</div>';
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
