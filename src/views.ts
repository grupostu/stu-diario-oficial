export function renderPortal(stats: { totalDocumentos: number; totalAlertas: number }): string {
  return `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stu Diario Oficial · Buscador y Alertas de Diarios Oficiales de El Salvador | Grupo Stu</title>
  <meta name="description" content="Motor de búsqueda inteligente por DUI, Nombre, Edictos Judiciales y Registro de Marcas en Diarios Oficiales de El Salvador. Alertas preventivas contra condenas en rebeldía.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
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
            },
            dark: {
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

  <!-- Header Institucional Grupo Stu -->
  <header class="border-b border-slate-800/80 bg-slate-950/80 sticky top-0 z-40 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-cyan-500 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-brand-500/20">
          S
        </div>
        <div>
          <span class="font-extrabold text-white text-base tracking-wider">STU <span class="text-brand-400">DIARIO OFICIAL</span></span>
          <span class="hidden sm:inline-block text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded ml-2">El Salvador · LAIP Art. 10</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button onclick="openModalAlert()" class="bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-400 hover:to-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2">
          <i class="fa-solid fa-bell"></i> Activar Alertas Preventivas
        </button>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <main class="flex-1 max-w-5xl mx-auto px-4 py-12 w-full">
    <div class="text-center mb-10">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold uppercase tracking-wider mb-4">
        <i class="fa-solid fa-shield-halved"></i> Prevención Legal Ciudadana y Transparencia
      </div>
      <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
        Consulta Inmediata de <span class="gradient-text">Diarios Oficiales</span>
      </h1>
      <p class="mt-3 text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
        Busca por <strong>DUI</strong>, <strong>Nombre</strong> o <strong>Razón Social</strong> en miles de páginas digitalizadas. Recibe avisos en tiempo real si apareces en edictos judiciales para evitar condenas en rebeldía.
      </p>
    </div>

    <!-- Buscador Avanzado -->
    <div class="glass-card p-4 sm:p-6 rounded-3xl border border-slate-800 mb-8 shadow-2xl">
      <form onsubmit="searchDiario(event)" class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
          <input type="text" id="query-input" placeholder="Ingresa tu número de DUI (ej. 02444983-6), Nombre o Empresa..." required
            class="w-full bg-slate-950/90 border border-slate-700 focus:border-brand-500 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm outline-none font-mono">
        </div>
        <select id="category-filter" class="bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3.5 text-slate-300 text-sm outline-none font-medium">
          <option value="">Todas las Categorías</option>
          <option value="EDICTO_JUDICIAL">Edictos Judiciales</option>
          <option value="REGISTRO_MARCA">Registro de Marcas</option>
          <option value="DECRETO_LEGISLATIVO">Decretos Legislativos</option>
          <option value="SUBASTA_EMBARGO">Subastas y Embargos</option>
        </select>
        <button type="submit" id="btn-search" class="bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold px-6 py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2">
          <i class="fa-solid fa-bolt"></i> Buscar
        </button>
      </form>
    </div>

    <!-- Contenedor de Resultados -->
    <div id="results-container" class="space-y-4">
      <!-- Dinámico vía JS -->
    </div>

    <!-- Aviso Legal Obligatorio (LAIP El Salvador) -->
    <div class="mt-16 p-6 rounded-2xl border border-slate-800 bg-slate-950/60 text-xs text-slate-400 leading-relaxed">
      <div class="flex items-center gap-2 text-slate-300 font-bold mb-2">
        <i class="fa-solid fa-scale-balanced text-brand-400"></i>
        <span>Fundamento Legal y Aviso de Responsabilidad (LAIP Arts. 10 y 11)</span>
      </div>
      <p>
        De conformidad con los Artículos 10 y 11 de la <strong>Ley de Acceso a la Información Pública (LAIP)</strong> de la República de El Salvador, las leyes, decretos, reglamentos, acuerdos, estados financieros y edictos publicados en el Diario Oficial constituyen información oficiosa y de pleno dominio público.
      </p>
      <p class="mt-2">
        <strong>Stu Diario Oficial</strong> es un servicio de indexación analítica, búsqueda y notificación privada operado por <strong>Grupo Stu, S.A.S.</strong> No constituye la gaceta oficial, no reemplaza la fe pública de la <strong>Dirección de la Imprenta Nacional</strong> ni sustituye el asesoramiento jurídico profesional. Los enlaces a documentos originales remiten directamente a los archivos oficiales de <code>diariooficial.gob.sv</code>.
      </p>
    </div>
  </main>

  <!-- Modal para Suscripción de Alertas -->
  <div id="modal-alert" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm hidden items-center justify-center p-4 z-50">
    <div class="glass-card max-w-md w-full p-6 sm:p-8 rounded-3xl border border-slate-700 text-left">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-bell text-brand-400"></i> Suscribir Alerta Preventiva
        </h3>
        <button onclick="closeModalAlert()" class="text-slate-400 hover:text-white text-lg"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <p class="text-xs text-slate-300 mb-6">
        Te avisaremos al instante si tu DUI o nombre aparece publicado en un edicto judicial, aviso de embargo o registro de marca.
      </p>
      <form onsubmit="submitAlert(event)" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">Criterio a Vigilar (DUI o Nombre Completo)</label>
          <input type="text" id="alert-criterion" placeholder="ej. 02444983-6 o Juan Pérez" required
            class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none font-mono">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">Tu Correo Electrónico</label>
          <input type="email" id="alert-email" placeholder="tu-correo@ejemplo.com" required
            class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">WhatsApp de Notificación (Opcional)</label>
          <input type="tel" id="alert-phone" placeholder="+503 7000-0000"
            class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none">
        </div>
        <button type="submit" class="w-full bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold py-3 rounded-xl text-sm transition-all">
          Guardar y Monitorear Diarios Oficiales
        </button>
      </form>
    </div>
  </div>

  <script>
    function openModalAlert() {
      document.getElementById('modal-alert').classList.remove('hidden');
      document.getElementById('modal-alert').classList.add('flex');
    }

    function closeModalAlert() {
      document.getElementById('modal-alert').classList.add('hidden');
      document.getElementById('modal-alert').classList.remove('flex');
    }

    function searchDiario(e) {
      e.preventDefault();
      const q = document.getElementById('query-input').value.trim();
      const cat = document.getElementById('category-filter').value;
      const resContainer = document.getElementById('results-container');
      const btn = document.getElementById('btn-search');

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Buscando...';
      resContainer.innerHTML = '<div class="p-8 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-2xl text-brand-400"></i><p class="mt-2 text-xs">Consultando base indexada oficial...</p></div>';

      fetch('/api/v1/search?q=' + encodeURIComponent(q) + (cat ? '&categoria=' + encodeURIComponent(cat) : ''))
        .then(r => r.json())
        .then(data => {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Buscar';
          if (!data.results || data.results.length === 0) {
            resContainer.innerHTML = '<div class="glass-card p-8 rounded-2xl text-center text-slate-400 border border-slate-800"><i class="fa-regular fa-circle-check text-3xl text-brand-400 mb-2"></i><p class="text-sm font-bold text-white">No se encontraron publicaciones con ese criterio.</p><p class="text-xs text-slate-400 mt-1">Tu número de DUI o nombre no tiene edictos ni avisos recientes registrados.</p></div>';
            return;
          }

          resContainer.innerHTML = data.results.map(item => \`
            <div class="glass-card p-5 sm:p-6 rounded-2xl border border-slate-800 hover:border-brand-500/50 transition-all text-left">
              <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span class="text-xs font-mono px-2.5 py-0.5 rounded bg-brand-500/20 text-brand-400 font-bold">\${item.diario.categoria}</span>
                <span class="text-xs text-slate-400 font-mono">Tomo \${item.diario.tomo} · N° \${item.diario.numero} · Pag. \${item.diario.pagina} · \${item.diario.fecha}</span>
              </div>
              <h4 class="text-base font-bold text-white mb-2">\${item.diario.titular}</h4>
              <p class="text-xs font-mono text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 mb-3">\${item.snippet}</p>
              <div class="flex justify-between items-center text-xs">
                <span class="text-slate-400">Fuente: Imprenta Nacional El Salvador</span>
                <a href="\${item.diario.pdfUrlOficial}" target="_blank" rel="noopener noreferrer" class="text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1">
                  Ver Documento Original <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </a>
              </div>
            </div>
          \`).join('');
        })
        .catch(() => {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Buscar';
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
      .then(data => {
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
