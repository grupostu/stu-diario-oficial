// Modelo de lectura de una página del PDF: ordena el texto por columnas y construye el mapa
// carácter -> (elemento del PDF, desplazamiento). Es EL MISMO código en el servidor (extracción del
// corpus) y en el navegador (capa de texto del visor), por lo que la posición de cada carácter
// transcrito coincide exactamente con la del PDF que se ve en pantalla.
//
// Entrada: `items` de pdf.js (`page.getTextContent().items`) y el ancho/alto de la página (escala 1).
// Salida: { texto, ci, co, lineas }
//   texto  : texto de la página en orden de lectura (columna izquierda y luego derecha, por bandas).
//   ci/co  : por cada carácter de `texto`, índice del item de pdf.js y desplazamiento dentro del item
//            (ci = -1 para los saltos de línea y espacios sintetizados).
//   lineas : [{ a, b, k, c, x0, x1 }] rango [a,b) en `texto`, clase (c = cabecera/pie, b = título o franja
//            a todo el ancho, p = cuerpo), columna (0 = ancho completo, 1 = izquierda, 2 = derecha).
export const LECTURA_CLIENT_JS = String.raw`
var GL_GAP_RUN = 14;      // separación (pt) que parte una línea en tramos independientes
var GL_MARGEN_CAB = 62;   // alto (pt) de la franja de cabecera y pie

function glModeloPagina(items, anchoPag, altoPag) {
  var mid = anchoPag / 2;
  var elems = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (!it || typeof it.str !== 'string' || it.str === '') continue;
    var t = it.transform;
    // Texto girado (marca de agua diagonal): no forma parte del contenido.
    if (Math.abs(t[1]) > 0.01 || Math.abs(t[2]) > 0.01) continue;
    elems.push({ i: i, x: t[4], y: t[5], w: it.width || 0, h: Math.abs(t[3]) || 8, s: it.str });
  }
  // Agrupar por línea base (tolerancia pequeña) de arriba hacia abajo.
  elems.sort(function (p, q) { return q.y - p.y || p.x - q.x; });
  var filas = [];
  for (var k = 0; k < elems.length; k++) {
    var e = elems[k];
    var f = filas.length ? filas[filas.length - 1] : null;
    // Un superíndice (6ª, 2°) queda más arriba y con letra menor: cuenta como parte de la misma línea.
    var tol = Math.max(1.2, 0.4 * Math.min(f ? f.h : 8, e.h));
    if (f && Math.min(f.h, e.h) < 0.8 * Math.max(f.h, e.h)) tol = Math.min(4.5, 0.6 * Math.max(f.h, e.h));
    if (f && Math.abs(f.y - e.y) <= tol) { f.e.push(e); if (e.h > f.h) f.h = e.h; }
    else filas.push({ y: e.y, h: e.h, e: [e] });
  }
  // Cada fila se parte en tramos por separación horizontal.
  var tramos = [];
  for (var r = 0; r < filas.length; r++) {
    var fila = filas[r];
    fila.e.sort(function (p, q) { return p.x - q.x; });
    var cur = null;
    for (var j = 0; j < fila.e.length; j++) {
      var el = fila.e[j];
      var vacio = el.s.trim() === '';
      if (cur && el.x - cur.x1 > GL_GAP_RUN && !vacio) { tramos.push(cur); cur = null; }
      if (!cur) { if (vacio) continue; cur = { y: fila.y, h: fila.h, x0: el.x, x1: el.x + el.w, e: [] }; }
      cur.e.push(el);
      cur.x1 = Math.max(cur.x1, el.x + el.w);
    }
    if (cur) tramos.push(cur);
  }
  // Clasificar cada tramo.
  for (var m = 0; m < tramos.length; m++) {
    var tr = tramos[m];
    var ancho = tr.x1 - tr.x0;
    var cruza = tr.x0 < mid - 18 && tr.x1 > mid + 18;
    tr.col = cruza ? 0 : ((tr.x0 + tr.x1) / 2 < mid ? 1 : 2);
    var txtTramo = '';
    for (var w = 0; w < tr.e.length; w++) txtTramo += tr.e[w].s;
    // Cabecera de la página, o el pie con la dirección de la Imprenta (solo en la portada).
    var cab = tr.y > altoPag - GL_MARGEN_CAB || (tr.y < 62 && /^\s*Direcci[oó]n:/.test(txtTramo));
    // Título o franja: cruza el centro de la página y está centrado y corto. Un párrafo a todo el ancho es cuerpo.
    var centrado = cruza && Math.abs((tr.x0 + tr.x1) / 2 - mid) < 30 && ancho < 330;
    tr.k = cab ? 'c' : (centrado ? 'b' : 'p');
    tr.ancho = ancho;
  }
  // Orden de lectura: cabecera, luego bandas delimitadas por los tramos a todo el ancho.
  tramos.sort(function (p, q) { return q.y - p.y || p.x0 - q.x0; });
  var orden = [];
  var cab_ = [], pie_ = [];
  var banda = { L: [], R: [] };
  function volcar() {
    for (var a = 0; a < banda.L.length; a++) orden.push(banda.L[a]);
    for (var b = 0; b < banda.R.length; b++) orden.push(banda.R[b]);
    banda = { L: [], R: [] };
  }
  for (var n = 0; n < tramos.length; n++) {
    var t2 = tramos[n];
    if (t2.k === 'c') { (t2.y > altoPag / 2 ? cab_ : pie_).push(t2); continue; }
    if (t2.col === 0) { volcar(); orden.push(t2); }
    else if (t2.col === 1) banda.L.push(t2);
    else banda.R.push(t2);
  }
  volcar();
  var todos = cab_.concat(orden, pie_);

  var texto = '';
  var ci = [], co = [], lineas = [];
  for (var q = 0; q < todos.length; q++) {
    var T = todos[q];
    var a0 = texto.length;
    var prev = null;
    for (var z = 0; z < T.e.length; z++) {
      var it2 = T.e[z];
      if (prev && it2.x - (prev.x + prev.w) > 0.2 * T.h && !/\s$/.test(prev.s) && !/^\s/.test(it2.s)) {
        texto += ' '; ci.push(-1); co.push(0);
      }
      for (var c = 0; c < it2.s.length; c++) { ci.push(it2.i); co.push(c); }
      texto += it2.s;
      prev = it2;
    }
    lineas.push({ a: a0, b: texto.length, k: T.k, c: T.col, x0: Math.round(T.x0 * 10) / 10, x1: Math.round(T.x1 * 10) / 10, y: Math.round(T.y * 10) / 10 });
    if (q < todos.length - 1) { texto += '\n'; ci.push(-1); co.push(0); }
  }
  return { texto: texto, ci: ci, co: co, lineas: lineas };
}

/**
 * Texto para buscar: une las palabras partidas con guion al final de línea ("ESCO-\nBAR" -> "ESCOBAR").
 * Devuelve el texto y, por cada carácter, su posición en el texto original de la página.
 */
function glTextoBusqueda(texto) {
  var out = [], mapa = [];
  var n = texto.length;
  for (var i = 0; i < n; i++) {
    var ch = texto.charAt(i);
    if (ch === '-' && texto.charAt(i + 1) === '\n' && i > 0 && /\p{L}/u.test(texto.charAt(i - 1)) && /\p{L}/u.test(texto.charAt(i + 2) || '')) { i++; continue; }
    out.push(ch); mapa.push(i);
  }
  mapa.push(n);
  return { t: out.join(''), mapa: mapa };
}
`;

export interface LineaPagina {
  a: number;
  b: number;
  k: 'c' | 'b' | 'p';
  c: 0 | 1 | 2;
  x0: number;
  x1: number;
  y: number;
}

export interface ModeloPagina {
  texto: string;
  ci: number[];
  co: number[];
  lineas: LineaPagina[];
}

interface ItemPdf {
  str: string;
  transform: number[];
  width?: number;
}

interface NucleoLectura {
  modeloPagina(items: ItemPdf[], ancho: number, alto: number): ModeloPagina;
  textoBusqueda(texto: string): { t: string; mapa: number[] };
}

/** Misma lógica que ejecuta el navegador (se construye desde el mismo texto). */
export const lectura = new Function(`${LECTURA_CLIENT_JS}; return { modeloPagina: glModeloPagina, textoBusqueda: glTextoBusqueda };`)() as NucleoLectura;
