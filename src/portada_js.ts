// Script de la portada (antes en línea en views.ts). Contenido idéntico: se sirve como archivo estático versionado.
import { CRITERIO_CLIENT_JS } from './criterio.js';
import { LECTURA_CLIENT_JS } from './lectura.js';
import { RESALTADO_CLIENT_JS } from './resaltado.js';
import { BUSQUEDA_CLIENT_JS } from './busqueda_vista.js';
import { VISOR_JS } from './visor_cliente.js';

export const PORTADA_JS = `    // Menú de la cabecera compartida: delegado en el documento porque el componente vuelve a pintar su navegación
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
    });`;
