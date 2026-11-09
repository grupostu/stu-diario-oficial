// Visor del Diario Oficial: todo el tomo en desplazamiento continuo, capa de texto oficial de PDF.js,
// búsqueda como la del navegador (solo marca lo buscado) y resaltado de publicaciones completas, incluso
// cuando continúan en otra página. Navegación entre diarios con retorno.
//
// Exactitud del resaltado: cada carácter transcrito se ubica con el mismo modelo de lectura que usa el
// servidor (src/lectura.ts) y se dibuja con los rectángulos reales de la capa de texto de PDF.js
// (Range.getClientRects), igual que la búsqueda nativa del navegador.

export const VISOR_CSS = `
    /* Barras de desplazamiento oscuras y discretas (en todo el portal) */
    * { scrollbar-width: thin; scrollbar-color: #334155 transparent; }
    *::-webkit-scrollbar { width: 10px; height: 10px; }
    *::-webkit-scrollbar-track { background: transparent; }
    *::-webkit-scrollbar-thumb { background: #334155; border-radius: 999px; border: 2px solid #0b1220; }
    *::-webkit-scrollbar-thumb:hover { background: #475569; }
    *::-webkit-scrollbar-corner { background: transparent; }

    /* Visor */
    #vz-scroll { position: relative; background: #0b1220; overflow: auto; scroll-behavior: auto; }
    #vz-paginas { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 16px 16px 80px; min-width: min-content; }
    .vz-pag { position: relative; background: #fff; box-shadow: 0 8px 30px rgba(0,0,0,.45); flex: none; --scale-factor: 1; }
    .vz-pag canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
    .vz-pag .vz-hl-capa { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
    .vz-pag .textLayer { position: absolute; inset: 0; overflow: hidden; line-height: 1; opacity: 1; z-index: 3; }
    .vz-pag .textLayer span, .vz-pag .textLayer br { color: transparent; }
    .vz-pag .textLayer ::selection { background: rgba(56,189,248,.45); }
    .vz-num { position: absolute; top: 6px; right: 8px; z-index: 4; font: 700 10px/1 'JetBrains Mono', monospace; color: #475569; background: rgba(241,245,249,.92); padding: 3px 6px; border-radius: 6px; pointer-events: none; }
    .vz-sin-texto { position: absolute; left: 50%; top: 14px; transform: translateX(-50%); z-index: 4; font: 600 11px/1.3 'Plus Jakarta Sans', sans-serif; color: #92400e; background: #fef3c7; border: 1px solid #f59e0b; padding: 5px 10px; border-radius: 8px; max-width: 80%; text-align: center; pointer-events: none; }
    .vz-cargando { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #94a3b8; font: 600 12px 'JetBrains Mono', monospace; }
    /* Búsqueda: misma convención que el navegador (amarillo; naranja la coincidencia activa) */
    .vz-hl { position: absolute; background: rgba(255, 213, 0, .55); mix-blend-mode: multiply; border-radius: 2px; }
    .vz-hl.vz-act { background: rgba(255, 138, 0, .75); outline: 2px solid #f97316; outline-offset: 0; }
    /* Publicación completa: banda esmeralda suave sobre sus líneas */
    .vz-reg { position: absolute; background: rgba(16, 185, 129, .20); mix-blend-mode: multiply; border-radius: 2px; }
    .vz-reg-borde { position: absolute; border-left: 3px solid #059669; background: transparent; }
    #vz-panel-lista .vz-tarjeta { border: 1px solid #1e293b; background: #0b1220; border-radius: 16px; padding: 14px; transition: border-color .15s, box-shadow .15s; }
    #vz-panel-lista .vz-tarjeta:hover { border-color: #334155; }
    #vz-panel-lista .vz-tarjeta.vz-activa { border-color: #10b981; box-shadow: 0 0 0 1px rgba(16,185,129,.45); }
    #vz-panel-lista mark.vz-m { background: #fde047; color: #0f172a; padding: 0 2px; border-radius: 3px; font-weight: 700; }
    .vz-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; border: 1px solid #334155; background: #0f172a; color: #cbd5e1; font: 600 11px 'JetBrains Mono', monospace; cursor: pointer; }
    .vz-chip:hover { border-color: #10b981; color: #fff; }
    .vz-chip b { color: #fbbf24; }
    .vz-btn { padding: 6px 10px; border-radius: 10px; background: #1e293b; border: 1px solid #334155; color: #e2e8f0; font: 700 11px 'JetBrains Mono', monospace; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
    .vz-btn:hover { background: #334155; }
    .vz-btn[disabled] { opacity: .4; cursor: default; }
    .vz-btn-primario { background: #10b981; border-color: #10b981; color: #022c22; }
    .vz-btn-primario:hover { background: #34d399; }
    #vz-aviso { display: none; }
`;

export const VISOR_HTML = `
  <!-- ========================================================================= -->
  <!-- VISOR DEL DIARIO OFICIAL: tomo completo + transcripción sincronizada      -->
  <!-- ========================================================================= -->
  <div id="modal-ebook" class="fixed inset-0 bg-slate-950 hidden flex-col z-50" role="dialog" aria-modal="true" aria-label="Visor del Diario Oficial">
    <div class="bg-slate-900 border-b border-slate-800 px-3 sm:px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2 shrink-0">
      <div class="min-w-0 mr-auto">
        <h4 class="text-xs sm:text-sm font-black text-white tracking-tight flex items-center gap-2 flex-wrap">
          <span id="vz-titulo">Diario Oficial</span>
          <span id="ebook-top-page-badge" class="text-[11px] text-slate-950 bg-amber-400 px-2 py-0.5 rounded-md font-mono font-black">Pág. 1</span>
        </h4>
        <span class="text-[10px] text-slate-400 font-mono">Documento original (PDF) con su transcripción</span>
      </div>

      <div class="flex flex-wrap items-center gap-1.5 font-mono text-xs">
        <button type="button" id="vz-prev" class="vz-btn" title="Página anterior" aria-label="Página anterior"><i class="fa-solid fa-chevron-up"></i></button>
        <div class="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-700">
          <input type="number" id="ebook-page-number" value="1" min="1" aria-label="Número de página" class="w-12 bg-slate-900 text-center text-white font-bold outline-none rounded py-0.5">
          <span class="text-slate-500 text-[11px]">/ <span id="vz-total">–</span></span>
        </div>
        <button type="button" id="vz-next" class="vz-btn" title="Página siguiente" aria-label="Página siguiente"><i class="fa-solid fa-chevron-down"></i></button>

        <div class="flex items-center bg-slate-950 rounded-lg border border-slate-700 p-0.5">
          <button type="button" id="vz-zoom-menos" class="px-2 py-1 hover:bg-slate-800 text-slate-300 rounded font-bold" title="Reducir" aria-label="Reducir zoom">−</button>
          <span id="vz-zoom-val" class="px-1.5 text-[11px] text-slate-300 w-11 text-center">125%</span>
          <button type="button" id="vz-zoom-mas" class="px-2 py-1 hover:bg-slate-800 text-slate-300 rounded font-bold" title="Aumentar" aria-label="Aumentar zoom">+</button>
        </div>

        <div class="flex items-center bg-slate-950 border border-slate-700 focus-within:border-amber-400 rounded-lg">
          <i class="fa-solid fa-magnifying-glass text-slate-500 text-[11px] pl-2.5"></i>
          <input type="search" id="ebook-inline-search" placeholder="Buscar en el diario…" autocomplete="off" spellcheck="false" aria-label="Buscar en el diario" class="w-40 sm:w-52 bg-transparent px-2 py-1.5 text-[12px] text-white outline-none">
          <span id="pdf-highlight-counter" class="text-[11px] text-slate-400 pr-1.5 whitespace-nowrap" aria-live="polite">0/0</span>
          <button type="button" id="vz-m-prev" class="px-1.5 py-1 text-slate-300 hover:text-white" title="Coincidencia anterior (Mayús+Intro)" aria-label="Coincidencia anterior"><i class="fa-solid fa-chevron-up text-[10px]"></i></button>
          <button type="button" id="vz-m-next" class="px-1.5 py-1 mr-0.5 text-slate-300 hover:text-white" title="Coincidencia siguiente (Intro)" aria-label="Coincidencia siguiente"><i class="fa-solid fa-chevron-down text-[10px]"></i></button>
        </div>
      </div>

      <div class="flex items-center gap-1.5">
        <button type="button" id="vz-cita" class="vz-btn" title="Cómo citar esta página"><i class="fa-solid fa-quote-right"></i><span class="hidden md:inline">Citar</span></button>
        <a id="vz-descarga" href="#" download class="vz-btn hidden sm:inline-flex" title="Descargar el PDF original"><i class="fa-solid fa-download"></i> PDF</a>
        <button type="button" id="vz-cerrar" class="vz-btn" title="Cerrar (Esc)" aria-label="Cerrar visor"><i class="fa-solid fa-xmark"></i></button>
      </div>
    </div>

    <!-- Otros diarios donde aparece lo buscado + retorno -->
    <div id="vz-otros" class="hidden bg-slate-900/70 border-b border-slate-800 px-3 sm:px-4 py-1.5 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400 shrink-0"></div>
    <div id="pdf-range-notice" role="status" aria-live="polite" class="hidden shrink-0 px-4 py-1.5 bg-slate-900 border-b border-amber-500/50 text-amber-300 text-xs font-bold"></div>

    <div class="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
      <div id="vz-scroll" class="flex-1 min-h-0 min-w-0">
        <div id="vz-estado" class="p-10 text-center text-slate-400 text-xs font-mono"><i class="fa-solid fa-circle-notch fa-spin text-2xl text-brand-400 block mb-3"></i>Cargando el diario…</div>
        <div id="vz-paginas"></div>
      </div>

      <aside id="ebook-side-panel" class="w-full md:w-[400px] lg:w-[460px] max-h-[40vh] md:max-h-none bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col shrink-0 min-h-0">
        <div class="px-4 py-3 border-b border-slate-800 bg-slate-950/60">
          <h5 class="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2"><i class="fa-solid fa-file-lines text-brand-400"></i> Publicaciones en esta página</h5>
          <p class="text-[11px] text-slate-400 mt-0.5">Pulsa una publicación para resaltarla completa en el PDF, aunque continúe en otra página. <span id="sidebar-page-label" class="text-white font-bold"></span></p>
        </div>
        <div id="vz-panel-lista" class="flex-1 overflow-y-auto p-3 space-y-3 text-xs leading-relaxed text-slate-300 min-h-0"></div>
        <div class="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 font-mono">Transcripción automática del PDF. Ante cualquier duda, el documento original manda.</div>
      </aside>
    </div>
  </div>

  <!-- Cómo citar -->
  <div id="modal-certified-citation" class="fixed inset-0 bg-slate-950/85 hidden items-center justify-center p-4 z-[60]" role="dialog" aria-modal="true" aria-label="Cómo citar">
    <div class="bg-slate-900 max-w-lg w-full p-5 sm:p-6 rounded-2xl border border-slate-700 text-left space-y-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-base font-black text-white">Cómo citar esta página</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">Ayuda para ubicar el texto. No es un documento oficial ni una certificación.</p>
        </div>
        <button type="button" id="vz-cita-cerrar" class="text-slate-400 hover:text-white text-lg" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <p id="certified-citation-body" class="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 leading-relaxed select-all"></p>
      <p class="text-[11px] text-slate-400 leading-relaxed">Verifica siempre el contenido en la publicación oficial de la Imprenta Nacional.
        <a href="https://www.diariooficial.gob.sv/" target="_blank" rel="noopener noreferrer" class="text-brand-400 hover:underline">diariooficial.gob.sv</a></p>
      <div class="flex justify-end gap-2">
        <button type="button" id="vz-cita-copiar" class="vz-btn vz-btn-primario"><i class="fa-regular fa-copy"></i> Copiar cita</button>
      </div>
    </div>
  </div>
`;

export const VISOR_JS = String.raw`
var VZ = {
  catalogo: null, diario: null, pdf: null, textos: [], busq: [], paginas: [], registros: [],
  ancho1: 612, alto1: 792, escala: 1.25, ajuste: true,
  term: '', matches: [], idx: -1, regActivo: null, pila: [], paginaActual: 1,
  carga: 0, obsVer: null, obsSoltar: null, rafScroll: 0, sinTexto: {}, cacheOtros: {}
};
var VZ_GAP = 14;
function vzEl(id) { return document.getElementById(id); }

function vzCatalogo() {
  if (VZ.catalogo) return Promise.resolve(VZ.catalogo);
  return fetch('/api/v1/diarios').then(function (r) { return r.json(); }).then(function (d) {
    VZ.catalogo = (d && d.diarios) || [];
    return VZ.catalogo;
  });
}

function vzFechaLarga(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return iso || '';
  var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return Number(m[3]) + ' de ' + meses[Number(m[2]) - 1] + ' de ' + m[1];
}
function vzEtiquetaDiario(d) { return 'Tomo ' + d.tomo + ' · N.° ' + d.numero + ' · ' + vzFechaLarga(d.fecha); }

function vzAviso(msg) {
  var b = vzEl('pdf-range-notice');
  b.textContent = msg; b.classList.remove('hidden');
  clearTimeout(window.__vzAviso);
  window.__vzAviso = setTimeout(function () { b.classList.add('hidden'); b.textContent = ''; }, 3500);
}
function showPageRangeNotice(m) { vzAviso(m); }
function showFloatingRadar(m) { vzAviso(m); }

// ---------------------------------------------------------------- carga del diario
function vzLiberarTodo() {
  if (VZ.obsVer) { VZ.obsVer.disconnect(); VZ.obsVer = null; }
  if (VZ.obsSoltar) { VZ.obsSoltar.disconnect(); VZ.obsSoltar = null; }
  VZ.paginas.forEach(function (P) { if (P && P.tarea) { try { P.tarea.cancel(); } catch (_) {} } });
  VZ.paginas = [];
  vzEl('vz-paginas').innerHTML = '';
}

function vzCargarDiario(id) {
  var token = ++VZ.carga;
  var d = (VZ.catalogo || []).filter(function (x) { return x.id === id; })[0];
  if (!d) return Promise.reject(new Error('Diario no disponible'));
  vzLiberarTodo();
  VZ.diario = d; VZ.pdf = null; VZ.textos = []; VZ.busq = []; VZ.registros = []; VZ.matches = []; VZ.idx = -1; VZ.regActivo = null; VZ.sinTexto = {};
  vzEl('vz-estado').style.display = 'block';
  vzEl('vz-estado').innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-2xl text-brand-400 block mb-3"></i>Cargando ' + gsEscapar(vzEtiquetaDiario(d)) + '…';
  vzEl('vz-titulo').textContent = 'Diario Oficial · ' + vzEtiquetaDiario(d);
  vzEl('vz-total').textContent = d.paginas;
  vzEl('ebook-page-number').max = d.paginas;
  var enlace = vzEl('vz-descarga'); enlace.href = d.pdf; enlace.setAttribute('download', 'Diario_Oficial_Tomo_' + d.tomo + '_N' + d.numero + '_' + d.fecha + '.pdf');
  if (!window.pdfjsLib) return Promise.reject(new Error('PDF.js no disponible'));
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  var pTextos = fetch('/data/paginas-' + d.id + '.json', { cache: 'no-cache' }).then(function (r) { return r.json(); });
  var pRegs = fetch('/api/v1/diarios/' + encodeURIComponent(d.id) + '/registros').then(function (r) { return r.json(); });
  var pPdf = window.pdfjsLib.getDocument(d.pdf).promise;
  return Promise.all([pTextos, pRegs, pPdf]).then(function (r) {
    if (token !== VZ.carga) return;
    VZ.textos = r[0].paginas || [];
    VZ.registros = (r[1] && r[1].registros) || [];
    VZ.pdf = r[2];
    VZ.ancho1 = r[0].ancho || 612; VZ.alto1 = r[0].alto || 792;
    VZ.textos.forEach(function (t, i) { if (!t || !String(t).replace(/\s/g, '')) VZ.sinTexto[i + 1] = true; });
    vzMontarPaginas();
    vzEl('vz-estado').style.display = 'none';
  });
}

function vzEscalaEfectiva() {
  if (VZ.ajuste && window.innerWidth < 768) {
    var ancho = (vzEl('vz-scroll').clientWidth || window.innerWidth) - 32;
    return Math.max(0.3, ancho / VZ.ancho1);
  }
  return VZ.escala;
}

function vzMontarPaginas() {
  var cont = vzEl('vz-paginas');
  cont.innerHTML = '';
  var esc = vzEscalaEfectiva();
  var w = Math.floor(VZ.ancho1 * esc), h = Math.floor(VZ.alto1 * esc);
  VZ.paginas = [null];
  for (var n = 1; n <= VZ.diario.paginas; n++) {
    var el = document.createElement('div');
    el.className = 'vz-pag'; el.dataset.n = String(n);
    el.style.width = w + 'px'; el.style.height = h + 'px';
    el.style.setProperty('--scale-factor', String(esc));
    el.innerHTML = '<span class="vz-num">' + n + '</span>' + (VZ.sinTexto[n] ? '<span class="vz-sin-texto">Esta página no tiene texto digital en el PDF: no se puede buscar ni resaltar en ella.</span>' : '');
    cont.appendChild(el);
    VZ.paginas.push({ n: n, el: el, estado: 0, modelo: null, divs: null, tarea: null, tareaTexto: null });
  }
  vzEl('vz-zoom-val').textContent = Math.round(esc * 100) + '%';
  var raiz = vzEl('vz-scroll');
  VZ.obsVer = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) vzRender(Number(e.target.dataset.n)); });
  }, { root: raiz, rootMargin: '1400px 0px' });
  VZ.obsSoltar = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (!e.isIntersecting) vzSoltar(Number(e.target.dataset.n)); });
  }, { root: raiz, rootMargin: '4500px 0px' });
  VZ.paginas.forEach(function (P) { if (P) { VZ.obsVer.observe(P.el); VZ.obsSoltar.observe(P.el); } });
}

function vzSoltar(n) {
  var P = VZ.paginas[n];
  if (!P || P.estado === 0) return;
  if (P.tarea) { try { P.tarea.cancel(); } catch (_) {} }
  if (P.tareaTexto) { try { P.tareaTexto.cancel(); } catch (_) {} }
  var num = '<span class="vz-num">' + n + '</span>' + (VZ.sinTexto[n] ? '<span class="vz-sin-texto">Esta página no tiene texto digital en el PDF: no se puede buscar ni resaltar en ella.</span>' : '');
  P.el.innerHTML = num;
  P.estado = 0; P.modelo = null; P.divs = null; P.tarea = null; P.tareaTexto = null;
}

function vzRender(n) {
  var P = VZ.paginas[n];
  if (!P || P.estado !== 0) return Promise.resolve();
  P.estado = 1;
  var token = VZ.carga;
  var esc = vzEscalaEfectiva();
  return VZ.pdf.getPage(n).then(function (page) {
    if (token !== VZ.carga || P.estado !== 1) return;
    var vp = page.getViewport({ scale: esc });
    var vp1 = page.getViewport({ scale: 1 });
    P.el.style.width = Math.floor(vp.width) + 'px'; P.el.style.height = Math.floor(vp.height) + 'px';
    var dpr = window.devicePixelRatio || 1;
    var canvas = document.createElement('canvas');
    canvas.width = Math.floor(vp.width * dpr); canvas.height = Math.floor(vp.height * dpr);
    var capaHl = document.createElement('div'); capaHl.className = 'vz-hl-capa';
    var capaTxt = document.createElement('div'); capaTxt.className = 'textLayer';
    P.el.insertBefore(canvas, P.el.firstChild);
    P.el.appendChild(capaHl); P.el.appendChild(capaTxt);
    P.capaHl = capaHl;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    P.tarea = page.render({ canvasContext: ctx, viewport: vp });
    var pRender = P.tarea.promise.catch(function () {});
    var pTexto = page.getTextContent().then(function (tc) {
      if (token !== VZ.carga || P.estado !== 1) return;
      var divs = [], strs = [];
      P.tareaTexto = window.pdfjsLib.renderTextLayer({ textContentSource: tc, container: capaTxt, viewport: vp, textDivs: divs, textContentItemsStr: strs });
      return P.tareaTexto.promise.then(function () {
        P.divs = divs;
        P.modelo = glModeloPagina(tc.items, vp1.width, vp1.height);
        // El texto de la página debe ser el mismo que el del índice; si difiere se reindexa solo esa página.
        if (VZ.textos[n - 1] !== P.modelo.texto) { VZ.textos[n - 1] = P.modelo.texto; VZ.busq[n] = null; vzRecalcular(true); }
      });
    }).catch(function (e) { if (!e || e.name !== 'RenderingCancelledException') console.warn('Texto de la página ' + n, e); });
    return Promise.all([pRender, pTexto]).then(function () {
      if (token !== VZ.carga || P.estado !== 1) return;
      P.estado = 2;
      vzPintar(n);
    });
  });
}

// ---------------------------------------------------------------- geometría exacta de un rango de texto
function vzRectsRango(P, a, b) {
  var m = P.modelo, out = [];
  if (!m || !P.divs) return out;
  var base = P.el.getBoundingClientRect();
  var i = a;
  while (i < b) {
    var ci = m.ci[i];
    if (ci < 0) { i++; continue; }
    var j = i;
    while (j < b && m.ci[j] === ci) j++;
    var div = P.divs[ci];
    var nodo = div && div.firstChild;
    if (nodo && nodo.nodeType === 3) {
      var r = document.createRange();
      var ini = Math.min(m.co[i], nodo.length), fin = Math.min(nodo.length, m.co[j - 1] + 1);
      if (fin > ini) {
        r.setStart(nodo, ini); r.setEnd(nodo, fin);
        var rs = r.getClientRects();
        for (var k = 0; k < rs.length; k++) {
          var q = rs[k];
          if (q.width < 0.5 || q.height < 0.5) continue;
          out.push({ l: q.left - base.left, t: q.top - base.top, w: q.width, h: q.height });
        }
      }
    }
    i = j;
  }
  return out;
}

function vzFundirRects(rs) {
  rs.sort(function (p, q) { return Math.abs(p.t - q.t) < 2 ? p.l - q.l : p.t - q.t; });
  var out = [];
  rs.forEach(function (r) {
    var u = out[out.length - 1];
    if (u && Math.abs(u.t - r.t) < 2.5 && Math.abs(u.h - r.h) < 3 && r.l - (u.l + u.w) < 4) {
      var fin = Math.max(u.l + u.w, r.l + r.w); u.l = Math.min(u.l, r.l); u.w = fin - u.l;
    } else out.push({ l: r.l, t: r.t, w: r.w, h: r.h });
  });
  return out;
}

function vzDibujar(capa, rects, clase) {
  rects.forEach(function (r) {
    var d = document.createElement('div');
    d.className = clase;
    d.style.cssText = 'left:' + r.l.toFixed(1) + 'px;top:' + r.t.toFixed(1) + 'px;width:' + r.w.toFixed(1) + 'px;height:' + r.h.toFixed(1) + 'px';
    capa.appendChild(d);
  });
}

function vzPintar(n) {
  var P = VZ.paginas[n];
  if (!P || P.estado !== 2 || !P.capaHl || !P.modelo) return;
  P.capaHl.innerHTML = '';
  // 1) publicación completa seleccionada (puede abarcar varias páginas)
  if (VZ.regActivo && VZ.regActivo.rangos) {
    var rs = [];
    VZ.regActivo.rangos.forEach(function (g) { if (g[0] === n) rs = rs.concat(vzRectsRango(P, g[1], g[2])); });
    var fund = vzFundirRects(rs);
    vzDibujar(P.capaHl, fund, 'vz-reg');
    if (fund.length) {
      var top = Math.min.apply(null, fund.map(function (r) { return r.t; })), bot = Math.max.apply(null, fund.map(function (r) { return r.t + r.h; }));
      var izq = Math.min.apply(null, fund.map(function (r) { return r.l; }));
      vzDibujar(P.capaHl, [{ l: izq - 5, t: top, w: 0, h: bot - top }], 'vz-reg-borde');
    }
  }
  // 2) coincidencias de la búsqueda
  var ms = VZ.matches;
  for (var i = 0; i < ms.length; i++) {
    if (ms[i].p !== n) continue;
    var fr = vzFundirRects(vzRectsRango(P, ms[i].a, ms[i].b));
    vzDibujar(P.capaHl, fr, 'vz-hl' + (i === VZ.idx ? ' vz-act' : ''));
    ms[i].pintado = true;
  }
}

function vzRepintarTodo() { for (var n = 1; n < VZ.paginas.length; n++) vzPintar(n); }

// ---------------------------------------------------------------- búsqueda (como la del navegador)
function vzPrep(n) {
  if (VZ.busq[n]) return VZ.busq[n];
  var txt = VZ.textos[n - 1] || '';
  var tb = glTextoBusqueda(txt);
  VZ.busq[n] = { t: tb.t, mapa: tb.mapa, prep: gsPrepararSegmento(tb.t) };
  return VZ.busq[n];
}

function vzAPagina(B, a, b) {
  // [a,b) sobre el texto de búsqueda -> [A,B) sobre el texto de la página
  return [B.mapa[a], B.mapa[b - 1] + 1];
}

function vzBuscarPagina(n, fq, an) {
  var B = vzPrep(n), out = [];
  if (!B.t) return out;
  if (fq) {
    // fq es una expresión de palabras separadas por cualquier signo: "jose alejandro rivas" encuentra "JOSÉ ALEJANDRO RIVAS."
    var re = new RegExp(fq, 'g'), x;
    var plano = B.prep.plano;
    while ((x = re.exec(plano)) !== null) {
      if (x[0].length === 0) { re.lastIndex++; continue; }
      var a = B.prep.ini[x.index], b = B.prep.fin[x.index + x[0].length - 1];
      var r = vzAPagina(B, a, b);
      out.push({ p: n, a: r[0], b: r[1] });
    }
  } else if (an) {
    var rangos = gsLocalizar(B.prep, an.criterios).map(function (h) { return [h.a, h.b]; });
    gsUnirRangos(rangos, B.t).forEach(function (g) {
      var r2 = vzAPagina(B, g[0], g[1]);
      out.push({ p: n, a: r2[0], b: r2[1] });
    });
  }
  return out;
}

function vzRecalcular(mantener) {
  var term = (VZ.term || '').replace(/\s+/g, ' ').trim();
  var previo = VZ.idx >= 0 && VZ.matches[VZ.idx] ? VZ.matches[VZ.idx] : null;
  VZ.matches = [];
  if (term.length >= 2 && VZ.diario) {
    var d9 = (typeof gsDuiDesdeConsulta === 'function') ? gsDuiDesdeConsulta(term) : null;
    var esDui = !!d9 || /^\d[\d\s-]{6,}$/.test(term);
    var palabras = esDui ? [] : gsPlegar(term).plano.split(/[^a-z0-9]+/).filter(Boolean);
    var fq = palabras.length ? palabras.join('[^a-z0-9]+') : '';
    var an = null;
    if (esDui) { an = gsAnalizarConsulta(term, undefined, d9 || undefined); if (!an.ok) an = null; }
    var total = VZ.diario.paginas, n;
    if (fq) {
      for (n = 1; n <= total; n++) VZ.matches = VZ.matches.concat(vzBuscarPagina(n, fq, null));
      // Sin coincidencia literal de la frase: se marcan sus palabras por separado (≥ 4 letras), nunca el diario entero.
      if (VZ.matches.length === 0) {
        var an2 = gsAnalizarConsulta(term);
        if (an2.ok) for (n = 1; n <= total; n++) VZ.matches = VZ.matches.concat(vzBuscarPagina(n, '', an2));
      }
    } else if (an) {
      for (n = 1; n <= total; n++) VZ.matches = VZ.matches.concat(vzBuscarPagina(n, '', an));
    }
  }
  VZ.idx = -1;
  if (mantener && previo) {
    for (var i = 0; i < VZ.matches.length; i++) if (VZ.matches[i].p === previo.p && VZ.matches[i].a === previo.a) { VZ.idx = i; break; }
  }
  vzContador();
  vzRepintarTodo();
}

function vzContador() {
  var el = vzEl('pdf-highlight-counter');
  el.textContent = VZ.matches.length ? ((VZ.idx >= 0 ? VZ.idx + 1 : 0) + '/' + VZ.matches.length) : '0/0';
  var campo = vzEl('ebook-inline-search');
  campo.style.color = (VZ.term && !VZ.matches.length) ? '#fca5a5' : '';
}

function vzIrCoincidencia(i, opts) {
  if (!VZ.matches.length) { vzAviso(VZ.term ? 'No hay coincidencias en este diario.' : 'Escribe qué buscar en el diario.'); return Promise.resolve(); }
  i = ((i % VZ.matches.length) + VZ.matches.length) % VZ.matches.length;
  var viejo = VZ.idx >= 0 ? VZ.matches[VZ.idx] : null;
  VZ.idx = i;
  var m = VZ.matches[i];
  vzContador();
  if (viejo && viejo.p !== m.p) vzPintar(viejo.p);
  return vzScrollAPagina(m.p, 0).then(function () { return vzRender(m.p); }).then(function () {
    vzPintar(m.p);
    var P = VZ.paginas[m.p];
    var act = P && P.capaHl && P.capaHl.querySelector('.vz-act');
    if (act) {
      var cont = vzEl('vz-scroll');
      var y = P.el.offsetTop + act.offsetTop - cont.clientHeight * 0.35;
      cont.scrollTo({ top: Math.max(0, y), behavior: (opts && opts.suave) ? 'smooth' : 'auto' });
    }
  });
}

// ---------------------------------------------------------------- navegación
function vzScrollAPagina(n, margen) {
  var P = VZ.paginas[n];
  if (!P) return Promise.resolve();
  vzEl('vz-scroll').scrollTo({ top: Math.max(0, P.el.offsetTop - (margen == null ? 10 : margen)), behavior: 'auto' });
  vzActualizarPaginaActual();
  return Promise.resolve();
}

function vzIrPagina(n) {
  n = Math.max(1, Math.min(VZ.diario ? VZ.diario.paginas : 1, Math.floor(Number(n) || 1)));
  return vzScrollAPagina(n).then(function () { return vzRender(n); });
}

function vzPaginaVisible() {
  var cont = vzEl('vz-scroll'), P1 = VZ.paginas[1];
  if (!P1) return 1;
  var paso = P1.el.offsetHeight + VZ_GAP;
  var y = cont.scrollTop + cont.clientHeight * 0.3 - P1.el.offsetTop;
  return Math.max(1, Math.min(VZ.paginas.length - 1, Math.floor(y / paso) + 1));
}

function vzActualizarPaginaActual() {
  var n = vzPaginaVisible();
  if (n === VZ.paginaActual && vzEl('ebook-page-number').value === String(n)) return;
  VZ.paginaActual = n;
  vzEl('ebook-page-number').value = n;
  vzEl('ebook-top-page-badge').textContent = 'Pág. ' + n + ' de ' + VZ.diario.paginas;
  vzEl('sidebar-page-label').textContent = '(Pág. ' + n + ')';
  vzPanel();
}

// ---------------------------------------------------------------- panel de publicaciones
function vzNombreClasif(r) { return r.clasificacionJuridica || 'Publicación'; }

function vzPanel() {
  var lista = vzEl('vz-panel-lista');
  var n = VZ.paginaActual;
  var regs = VZ.registros.filter(function (r) { return r.pagina <= n && (r.paginaFin || r.pagina) >= n; });
  if (!regs.length) {
    lista.innerHTML = '<div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-400"><p class="font-bold text-white mb-1">Pág. ' + n + '</p><p class="text-[11px]">' +
      (VZ.sinTexto[n] ? 'Esta página no tiene texto digital en el PDF, por eso no hay transcripción. Se muestra solo el documento original.' : 'No hay publicaciones indexadas en esta página. Usa el buscador del visor para localizar cualquier palabra.') + '</p></div>';
    return;
  }
  lista.innerHTML = regs.map(function (r) {
    var activa = VZ.regActivo && VZ.regActivo.id === r.id;
    var rango = (r.paginaFin && r.paginaFin !== r.pagina) ? 'Págs. ' + r.pagina + '–' + r.paginaFin : 'Pág. ' + r.pagina;
    var cuerpo = VZ.term && VZ.term.length >= 2 ? gsResaltarConsulta(r.contenido, VZ.term, 'vz-m', '') : gsEscapar(r.contenido);
    var duis = (r.duisEncontrados || []).map(function (d) { return '<button type="button" class="vz-chip" data-vz-buscar="' + gsEscapar(d) + '"><i class="fa-solid fa-fingerprint text-amber-400"></i>' + gsEscapar(d) + '</button>'; }).join(' ');
    return '<article class="vz-tarjeta' + (activa ? ' vz-activa' : '') + '" data-vz-reg="' + gsEscapar(r.id) + '">' +
      '<div class="flex flex-wrap items-center justify-between gap-2 mb-2"><span class="text-[11px] font-mono font-bold text-emerald-300">' + gsEscapar(vzNombreClasif(r)) + '</span>' +
      '<span class="text-[11px] font-mono font-bold text-amber-300">' + gsEscapar(rango) + '</span></div>' +
      '<h6 class="font-bold text-white text-[12px] leading-snug mb-2">' + gsEscapar(r.titular) + '</h6>' +
      '<div class="text-[11.5px] text-slate-300 whitespace-pre-line break-words max-h-64 overflow-y-auto pr-1">' + cuerpo + '</div>' +
      (duis ? '<div class="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800"><span class="text-[10px] text-slate-500 font-mono">DUI:</span>' + duis + '</div>' : '') +
      '<div class="mt-2.5 flex gap-2"><button type="button" class="vz-btn' + (activa ? ' vz-btn-primario' : '') + '" data-vz-resaltar="' + gsEscapar(r.id) + '"><i class="fa-solid fa-highlighter"></i> ' + (activa ? 'Quitar resaltado' : 'Resaltar en el PDF') + '</button></div></article>';
  }).join('');
  var act = lista.querySelector('.vz-activa');
  if (act) lista.scrollTop = act.offsetTop - 8;
}

function vzResaltarRegistro(id, sinScroll) {
  var r = VZ.registros.filter(function (x) { return x.id === id; })[0];
  var igual = VZ.regActivo && VZ.regActivo.id === id;
  VZ.regActivo = igual && !sinScroll ? null : (r || null);
  vzRepintarTodo();
  vzPanel();
  if (VZ.regActivo && !sinScroll) {
    var P0 = VZ.regActivo.rangos && VZ.regActivo.rangos[0] ? VZ.regActivo.rangos[0][0] : VZ.regActivo.pagina;
    var ult = VZ.regActivo.rangos && VZ.regActivo.rangos.length ? VZ.regActivo.rangos[VZ.regActivo.rangos.length - 1][0] : P0;
    return vzScrollAPagina(P0, 10).then(function () {
      var ps = [];
      for (var n = P0; n <= ult; n++) ps.push(vzRender(n));
      return Promise.all(ps);
    }).then(function () {
      vzRepintarTodo();
      var Pg = VZ.paginas[P0], b = Pg && Pg.capaHl && Pg.capaHl.querySelector('.vz-reg-borde');
      if (b) vzEl('vz-scroll').scrollTo({ top: Math.max(0, Pg.el.offsetTop + b.offsetTop - 90), behavior: 'auto' });
      if (ult !== P0) vzAviso('Esta publicación continúa hasta la pág. ' + ult + ': se resalta completa.');
    });
  }
  return Promise.resolve();
}

// ---------------------------------------------------------------- otros diarios y retorno
function vzOtros() {
  var cont = vzEl('vz-otros');
  var term = (VZ.term || '').trim();
  var back = VZ.pila.length ? VZ.pila[VZ.pila.length - 1] : null;
  var html = '';
  if (back) html += '<button type="button" class="vz-btn" data-vz-volver="1"><i class="fa-solid fa-arrow-left"></i> Volver al ' + gsEscapar(back.etiqueta) + ' (pág. ' + back.pagina + ')</button>';
  var finalizar = function (lista) {
    if (lista && lista.length) {
      html += '<span>Esta búsqueda también aparece en:</span>' + lista.map(function (o) {
        return '<button type="button" class="vz-chip" data-vz-diario="' + gsEscapar(o.id) + '" data-vz-pag="' + o.primeraPagina + '"><i class="fa-solid fa-book-open"></i>' + gsEscapar('Tomo ' + o.tomo + ' · N.° ' + o.numero + ' · ' + o.fecha) + ' <b>' + o.total + '</b></button>';
      }).join(' ');
    }
    cont.innerHTML = html;
    cont.classList.toggle('hidden', !html);
    cont.style.display = html ? 'flex' : 'none';
  };
  if (term.length < 3) { finalizar(null); return; }
  var clave = term.toLowerCase();
  var usar = function (data) {
    if (term !== (VZ.term || '').trim()) return;
    finalizar((data || []).filter(function (o) { return VZ.diario && o.id !== VZ.diario.id && o.total > 0; }));
  };
  if (VZ.cacheOtros[clave]) { usar(VZ.cacheOtros[clave]); return; }
  finalizar(null);
  fetch('/api/v1/coincidencias?q=' + encodeURIComponent(term)).then(function (r) { return r.json(); }).then(function (d) {
    VZ.cacheOtros[clave] = (d && d.diarios) || [];
    usar(VZ.cacheOtros[clave]);
  }).catch(function () {});
}

function vzCambiarDiario(id, pagina, term) {
  if (VZ.diario && VZ.diario.id !== id) VZ.pila.push({ id: VZ.diario.id, etiqueta: vzEtiquetaDiario(VZ.diario), pagina: VZ.paginaActual, term: VZ.term });
  return vzAbrir({ diarioId: id, pagina: pagina, termino: term, conservarPila: true });
}

function vzVolver() {
  var b = VZ.pila.pop();
  if (!b) return;
  vzAbrir({ diarioId: b.id, pagina: b.pagina, termino: b.term, conservarPila: true });
}

// ---------------------------------------------------------------- apertura
function vzAbrir(o) {
  o = o || {};
  var modal = vzEl('modal-ebook');
  modal.classList.remove('hidden'); modal.classList.add('flex');
  document.documentElement.style.overflow = 'hidden';
  var term = o.termino != null ? String(o.termino) : (VZ.term || '');
  return vzCatalogo().then(function (cat) {
    if (!cat.length) { vzEl('vz-estado').style.display = 'block'; vzEl('vz-estado').textContent = 'No hay diarios disponibles.'; return; }
    var id = o.diarioId && cat.some(function (c) { return c.id === o.diarioId; }) ? o.diarioId : (VZ.diario && !o.diarioId ? VZ.diario.id : cat[cat.length - 1].id);
    var carga = (!VZ.diario || VZ.diario.id !== id || !VZ.paginas.length) ? vzCargarDiario(id) : Promise.resolve();
    return carga.then(function () {
      VZ.term = term;
      vzEl('ebook-inline-search').value = term;
      VZ.regActivo = null;
      vzRecalcular();
      vzOtros();
      var pag = Math.max(1, Math.min(VZ.diario.paginas, Math.floor(Number(o.pagina) || 1)));
      var rec = o.registroId ? VZ.registros.filter(function (r) { return r.id === o.registroId; })[0] : null;
      var ini = rec ? rec.pagina : pag, fin = rec ? (rec.paginaFin || rec.pagina) : pag;
      var objetivo = -1;
      for (var i = 0; i < VZ.matches.length; i++) { if (VZ.matches[i].p >= ini && VZ.matches[i].p <= Math.max(fin, ini)) { objetivo = i; break; } }
      if (objetivo < 0) for (var k = 0; k < VZ.matches.length; k++) { if (VZ.matches[k].p >= pag) { objetivo = k; break; } }
      var listo = vzIrPagina(pag);
      if (rec && !VZ.matches.length) listo = listo.then(function () { return vzResaltarRegistro(rec.id, false); });
      else if (objetivo >= 0) listo = listo.then(function () { return vzIrCoincidencia(objetivo); });
      return listo.then(function () { vzActualizarPaginaActual(); vzPanel(); });
    });
  }).catch(function (e) {
    console.warn('Visor:', e);
    vzEl('vz-estado').style.display = 'block';
    vzEl('vz-estado').innerHTML = '<p class="text-rose-300 font-bold">No se pudo cargar el diario.</p><p class="mt-1">Revisa tu conexión y vuelve a intentar.</p>';
  });
}

function openEbookViewer(pageNum, term, diarioId, registroId) {
  if (VZ.diario && diarioId && diarioId !== VZ.diario.id) VZ.pila = [];
  return vzAbrir({ pagina: parseInt(pageNum, 10) || 1, termino: term != null ? term : (document.getElementById('query-input') ? document.getElementById('query-input').value.trim() : ''), diarioId: diarioId, registroId: registroId });
}

function closeEbookViewer() {
  var modal = vzEl('modal-ebook');
  modal.classList.add('hidden'); modal.classList.remove('flex');
  document.documentElement.style.overflow = '';
}
function focusTermInPdfFromTranscription(term) { VZ.term = String(term || ''); vzEl('ebook-inline-search').value = VZ.term; vzRecalcular(); vzOtros(); if (VZ.matches.length) vzIrCoincidencia(0); }

function vzZoom(delta, fijo) {
  var base = vzEscalaEfectiva();
  VZ.ajuste = false;
  VZ.escala = Math.min(3, Math.max(0.5, fijo != null ? fijo : Math.round((base + delta) * 100) / 100));
  var pag = VZ.paginaActual;
  VZ.paginas.forEach(function (P) { if (P && P.tarea) { try { P.tarea.cancel(); } catch (_) {} } });
  vzMontarPaginas();
  vzScrollAPagina(pag, 10).then(function () { vzActualizarPaginaActual(); });
}

// ---------------------------------------------------------------- cita
function vzTextoCita() {
  var d = VZ.diario;
  if (!d) return '';
  var t = 'Diario Oficial de la República de El Salvador, Tomo ' + d.tomo + ', N.° ' + d.numero + ', ' + vzFechaLarga(d.fecha) + ', pág. ' + VZ.paginaActual + '.';
  var reg = VZ.regActivo || VZ.registros.filter(function (r) { return r.pagina <= VZ.paginaActual && (r.paginaFin || r.pagina) >= VZ.paginaActual; })[0];
  if (VZ.regActivo && reg) t += ' Publicación: ' + reg.titular + '.';
  return t;
}
function copyCitation(text) {
  if (!navigator.clipboard) { vzAviso('Tu navegador no permite copiar automáticamente.'); return; }
  navigator.clipboard.writeText(text).then(function () { vzAviso('Cita copiada.'); }, function () { vzAviso('No se pudo copiar.'); });
}
function openCertifiedCitationModal() {
  vzEl('certified-citation-body').textContent = vzTextoCita();
  var m = vzEl('modal-certified-citation'); m.classList.remove('hidden'); m.classList.add('flex');
}
function closeCertifiedCitationModal() { var m = vzEl('modal-certified-citation'); m.classList.add('hidden'); m.classList.remove('flex'); }
function copyCurrentPageCitation() { copyCitation(vzTextoCita()); }

// ---------------------------------------------------------------- eventos
function vzIniciar() {
  var scroll = vzEl('vz-scroll');
  scroll.addEventListener('scroll', function () {
    if (VZ.rafScroll) return;
    VZ.rafScroll = requestAnimationFrame(function () { VZ.rafScroll = 0; vzActualizarPaginaActual(); });
  }, { passive: true });
  var campo = vzEl('ebook-inline-search');
  var temp = 0;
  campo.addEventListener('input', function () {
    VZ.term = campo.value;
    clearTimeout(temp);
    temp = setTimeout(function () {
      vzRecalcular();
      vzOtros();
      vzPanel();
      if (VZ.matches.length) {
        // La primera coincidencia a partir de la página que se está leyendo.
        var i = 0; for (; i < VZ.matches.length; i++) if (VZ.matches[i].p >= VZ.paginaActual) break;
        vzIrCoincidencia(i >= VZ.matches.length ? 0 : i, { suave: false });
      }
    }, 140);
  });
  campo.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); vzIrCoincidencia(VZ.idx + (ev.shiftKey ? -1 : 1)); }
  });
  vzEl('vz-m-next').onclick = function () { vzIrCoincidencia(VZ.idx + 1); };
  vzEl('vz-m-prev').onclick = function () { vzIrCoincidencia(VZ.idx - 1); };
  vzEl('vz-prev').onclick = function () { vzIrPagina(VZ.paginaActual - 1); };
  vzEl('vz-next').onclick = function () { vzIrPagina(VZ.paginaActual + 1); };
  vzEl('ebook-page-number').addEventListener('change', function (ev) {
    var p = parseInt(ev.target.value, 10);
    if (p >= 1 && p <= VZ.diario.paginas) vzIrPagina(p);
    else { ev.target.value = VZ.paginaActual; vzAviso('El tomo tiene páginas de la 1 a la ' + VZ.diario.paginas + '.'); }
  });
  vzEl('vz-zoom-mas').onclick = function () { vzZoom(0.2); };
  vzEl('vz-zoom-menos').onclick = function () { vzZoom(-0.2); };
  vzEl('vz-cerrar').onclick = closeEbookViewer;
  vzEl('vz-cita').onclick = openCertifiedCitationModal;
  vzEl('vz-cita-cerrar').onclick = closeCertifiedCitationModal;
  vzEl('vz-cita-copiar').onclick = function () { copyCitation(vzEl('certified-citation-body').textContent); };
  vzEl('vz-panel-lista').addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target : null;
    if (!t) return;
    var b = t.closest('[data-vz-resaltar]');
    if (b) { vzResaltarRegistro(b.getAttribute('data-vz-resaltar')); return; }
    var c = t.closest('[data-vz-buscar]');
    if (c) { VZ.term = c.getAttribute('data-vz-buscar'); campo.value = VZ.term; vzRecalcular(); vzOtros(); vzPanel(); if (VZ.matches.length) vzIrCoincidencia(0); }
  });
  vzEl('vz-otros').addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target : null;
    if (!t) return;
    if (t.closest('[data-vz-volver]')) { vzVolver(); return; }
    var d = t.closest('[data-vz-diario]');
    if (d) vzCambiarDiario(d.getAttribute('data-vz-diario'), parseInt(d.getAttribute('data-vz-pag'), 10) || 1, VZ.term);
  });
  document.addEventListener('keydown', function (ev) {
    var abierto = !vzEl('modal-ebook').classList.contains('hidden');
    if (!abierto) return;
    if (ev.key === 'Escape') {
      var cm = vzEl('modal-certified-citation');
      if (!cm.classList.contains('hidden')) closeCertifiedCitationModal(); else closeEbookViewer();
    } else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'f') { ev.preventDefault(); campo.focus(); campo.select(); }
  });
  window.addEventListener('resize', function () {
    if (!VZ.ajuste || window.innerWidth >= 768 || vzEl('modal-ebook').classList.contains('hidden') || !VZ.diario) return;
    clearTimeout(window.__vzRs);
    window.__vzRs = setTimeout(function () { var pag = VZ.paginaActual; vzMontarPaginas(); vzScrollAPagina(pag, 10); }, 200);
  });
}
`;
