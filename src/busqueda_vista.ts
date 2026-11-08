// Presentación en el navegador de los resultados de búsqueda por campo y párrafo.
// Se escribe sin plantillas de texto (solo concatenación) para incrustarse tal cual dentro de la portada.
// Todo texto dinámico pasa por gsEscapar (núcleo compartido, src/resaltado.ts) antes de entrar al DOM; los únicos
// fragmentos HTML que se insertan sin escapar vienen del servidor ya escapados y con <mark> (campo `html`).

export const BUSQUEDA_CLIENT_JS = String.raw`
var gsConsultaActual = '';

function gsPlural(n, uno, varios) { return n === 1 ? uno : varios; }

function gsTextoCriterio(c) {
  if (c.tipo === 'frase') return 'frase exacta «' + c.texto + '»';
  if (c.tipo === 'decreto') return c.texto;
  if (c.tipo === 'dui') return 'DUI ' + c.texto;
  return 'palabra «' + c.texto + '»';
}

function gsHtmlResumen(data) {
  var desde = (data.pagina - 1) * data.porPagina + 1;
  var hasta = Math.min(data.total, data.pagina * data.porPagina);
  var criterios = (data.consulta && data.consulta.criterios) || [];
  var texto = 'Se ' + gsPlural(data.total, 'encontró ', 'encontraron ') + data.total + ' ' + gsPlural(data.total, 'publicación', 'publicaciones') +
    ' que ' + gsPlural(data.total, 'contiene', 'contienen') + ' todo lo que buscaste. Mostrando de la ' + desde + ' a la ' + hasta +
    ' (página ' + data.pagina + ' de ' + data.totalPaginas + '). Lo resaltado en amarillo es la coincidencia, ubicada en el campo y el párrafo exactos donde aparece.';
  var interp = '';
  if (criterios.length > 0) {
    interp = '<p class="mt-1 text-[11px] text-slate-400">Así interpretamos tu búsqueda: ' +
      criterios.map(function (c) { return '<span class="inline-block px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono">' + gsEscapar(gsTextoCriterio(c)) + '</span>'; }).join(' ') +
      '. Para buscar una frase tal cual, escríbela entre comillas.</p>';
  }
  return '<p class="text-xs sm:text-sm text-slate-200 leading-relaxed">' + gsEscapar(texto) + '</p>' + interp;
}

function gsHtmlFragmento(f, pagina) {
  var marcas = f.rangos && f.rangos.length ? f.texto.slice(f.rangos[0][0], f.rangos[0][1]) : '';
  var botonPdf = marcas
    ? '<button type="button" data-gs-visor="1" data-pag="' + pagina + '" data-term="' + gsEscapar(marcas) + '" class="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 underline underline-offset-2 whitespace-nowrap">Ubicar en el PDF</button>'
    : '';
  return '<figure class="rounded-2xl border border-slate-800/80 bg-slate-950/85 p-4">' +
    '<figcaption class="flex flex-wrap items-center justify-between gap-2 mb-2">' +
      '<span class="text-[11px] font-mono font-black uppercase tracking-wide text-amber-300">Coincide en: ' + gsEscapar(f.etiqueta) + '</span>' +
      botonPdf +
    '</figcaption>' +
    '<blockquote class="text-xs sm:text-sm text-slate-200 leading-relaxed">' +
      (f.recortadoAntes ? '<span aria-hidden="true" class="text-slate-500">&hellip; </span>' : '') + f.html +
      (f.recortadoDespues ? '<span aria-hidden="true" class="text-slate-500"> &hellip;</span>' : '') +
    '</blockquote></figure>';
}

function gsHtmlTarjeta(item) {
  var d = item.diario, id = item.identificacion, cab = item.cabecera;
  var citation = 'Diario Oficial Tomo ' + d.tomo + ', N° ' + d.numero + ', Pág. ' + d.pagina + ' de 164 (' + d.fecha + ')';
  var cuerpo = (item.coincidencias || []).filter(function (f) { return f.ubicacion === 'cuerpo'; });
  var cabeceraCoincide = (item.coincidencias || []).filter(function (f) { return f.ubicacion === 'cabecera' && f.rangos.length > 0; });
  var clasif = d.clasificacionJuridica || 'Edicto Judicial';
  var html = '<article class="glass-card p-5 sm:p-7 rounded-3xl border ' + (item.coincidenciaExacta ? 'border-brand-500/50 bg-brand-950/10' : 'border-slate-800') + ' hover:border-brand-500/70 transition-all text-left">';

  // 1) Identificación del documento: tipo, número, título, órgano, fecha y ubicación en el diario
  html += '<div class="flex flex-wrap items-center justify-between gap-2 mb-3"><div class="flex flex-wrap items-center gap-2">' +
    getLegalClassificationBadge(clasif) +
    '<span class="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200">' + cab.tipoHtml + '</span>' +
    (cab.numeroHtml ? '<span class="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/40 text-indigo-200">' + cab.numeroHtml + '</span>' : '') +
    '<span class="text-xs font-mono font-black px-3 py-1 rounded-lg bg-amber-400 text-slate-950">Pág. ' + gsEscapar(d.pagina) + ' de 164</span>' +
    '</div>' +
    '<button type="button" data-gs-cita="' + gsEscapar(citation) + '" title="Copiar la cita de esta publicación" class="text-xs text-slate-400 hover:text-white font-mono flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800"><i class="fa-regular fa-copy text-brand-400"></i> Copiar Cita</button></div>';
  html += '<h4 class="text-base sm:text-lg font-bold text-white mb-2">' + cab.tituloHtml + '</h4>';
  html += '<dl class="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 mb-3 text-[11px] sm:text-xs text-slate-300">' +
    '<div><dt class="inline text-slate-500">Órgano emisor: </dt><dd class="inline">' + (cab.organoHtml || 'No indicado en la publicación') + '</dd></div>' +
    '<div><dt class="inline text-slate-500">Fecha de publicación: </dt><dd class="inline">' + cab.fechaHtml + '</dd></div>' +
    '<div><dt class="inline text-slate-500">Ubicación: </dt><dd class="inline">' + gsEscapar(id.diario) + '</dd></div></dl>';

  // 2) Fragmentos coincidentes, cada uno rotulado con su campo/párrafo
  if (cuerpo.length > 0) {
    html += '<div class="space-y-2.5" role="group" aria-label="Fragmentos donde coincide tu búsqueda">' +
      cuerpo.map(function (f) { return gsHtmlFragmento(f, d.pagina); }).join('') + '</div>';
    if (item.coincidenciasOmitidas > 0) {
      html += '<p class="mt-2 text-[11px] text-slate-400">Hay ' + item.coincidenciasOmitidas + ' ' + gsPlural(item.coincidenciasOmitidas, 'párrafo más', 'párrafos más') +
        ' con coincidencias en esta publicación. Ábrela en el Visor Ebook para recorrerlos todos.</p>';
    }
  } else if (cabeceraCoincide.length > 0) {
    html += '<p class="rounded-2xl border border-slate-800/80 bg-slate-950/85 p-4 text-xs sm:text-sm text-slate-300 leading-relaxed">Tu búsqueda coincide con los datos de identificación de este documento (' +
      gsEscapar(cabeceraCoincide.map(function (f) { return f.etiqueta.toLowerCase(); }).join(', ')) + '), que aparecen resaltados arriba.</p>';
  } else {
    html += '<p class="rounded-2xl border border-slate-800/80 bg-slate-950/85 p-4 text-xs sm:text-sm text-slate-300 leading-relaxed">Este registro está asociado al DUI consultado en nuestro índice, pero el número no aparece escrito de forma literal en el texto transcrito. Revísalo en el PDF original.</p>';
  }

  html += renderDuiChipsHtml(d.duisEncontrados, d.pagina);
  html += '<div class="flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-800/80 pt-3 mt-3"><div class="flex flex-wrap items-center gap-3">' +
    '<button type="button" data-gs-visor="1" data-pag="' + gsEscapar(d.pagina) + '" data-term="" class="bg-brand-500 hover:bg-brand-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-brand-500/20"><i class="fa-solid fa-book-open-reader"></i> Abrir en Visor Ebook y Remarcar en PDF (Pág. ' + gsEscapar(d.pagina) + ')</button>' +
    '<a href="/pdf/23-10-2026.pdf#page=' + gsEscapar(d.pagina) + '" download="Diario_Oficial_23_Octubre_2026_GrupoStu.pdf" class="text-slate-400 hover:text-white font-bold flex items-center gap-1"><i class="fa-solid fa-download"></i> PDF Original</a></div>' +
    '<a href="https://www.diariooficial.gob.sv/" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5">Fuente Estatal: diariooficial.gob.sv <i class="fa-solid fa-arrow-up-right-from-square text-[11px]"></i></a></div>';
  return html + '</article>';
}

function gsHtmlPaginacion(data) {
  if (data.totalPaginas <= 1) return '';
  var prev = data.pagina > 1, sig = data.pagina < data.totalPaginas;
  var base = 'px-4 py-2.5 rounded-xl border text-xs font-bold ';
  return '<nav aria-label="Paginación de resultados" class="flex flex-wrap items-center justify-between gap-3 pt-2">' +
    '<button type="button" data-gs-pagina="' + (data.pagina - 1) + '"' + (prev ? '' : ' disabled') + ' class="' + base + (prev ? 'border-slate-600 text-white hover:bg-slate-800' : 'border-slate-800 text-slate-600 cursor-not-allowed') + '">&larr; Página anterior</button>' +
    '<span class="text-xs text-slate-300 font-mono">Página ' + data.pagina + ' de ' + data.totalPaginas + '</span>' +
    '<button type="button" data-gs-pagina="' + (data.pagina + 1) + '"' + (sig ? '' : ' disabled') + ' class="' + base + (sig ? 'border-slate-600 text-white hover:bg-slate-800' : 'border-slate-800 text-slate-600 cursor-not-allowed') + '">Página siguiente &rarr;</button></nav>';
}

/** Pinta resumen, tarjetas y paginación. Devuelve el HTML de las tarjetas. */
function gsRenderResultados(data) {
  return data.resultados.map(gsHtmlTarjeta).join('') + gsHtmlPaginacion(data);
}

/** true si algún término de la consulta aparece en el texto (misma lógica de coincidencia que el servidor). */
function gsRegistroCoincide(texto, consulta) {
  var an = gsAnalizarConsulta(consulta);
  if (!an.ok) return false;
  return gsLocalizar(gsPrepararSegmento(texto), an.criterios).length > 0;
}

/** Un solo manejador delegado: sin atributos onclick con texto del usuario. */
function gsActivarAcciones(contenedor, buscarPagina) {
  if (contenedor.__gsActivo) return;
  contenedor.__gsActivo = true;
  contenedor.addEventListener('click', function (ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest('[data-gs-visor],[data-gs-cita],[data-gs-pagina]') : null;
    if (!el || el.disabled) return;
    if (el.hasAttribute('data-gs-visor')) {
      var t = el.getAttribute('data-term') || gsConsultaActual;
      openEbookViewer(parseInt(el.getAttribute('data-pag'), 10) || 1, t);
    } else if (el.hasAttribute('data-gs-cita')) {
      copyCitation(el.getAttribute('data-gs-cita'));
    } else if (el.hasAttribute('data-gs-pagina')) {
      buscarPagina(parseInt(el.getAttribute('data-gs-pagina'), 10) || 1);
    }
  });
}
`;
