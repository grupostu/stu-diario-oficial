// Núcleo de coincidencias y resaltado: UNA sola fuente de verdad para servidor y navegador.
//
// El código vive como texto JavaScript simple (ES2018) para poder:
//  - ejecutarlo en el servidor (abajo, con `new Function`), y
//  - incrustarlo tal cual en la página (`RESALTADO_CLIENT_JS`), de modo que ambos lados apliquen
//    exactamente las mismas reglas de plegado, tokenización y resaltado (mismo patrón que criterio.ts).
//
// Garantías de diseño:
//  - Insensible a mayúsculas y a diacríticos (á, ñ, ü...). Cada carácter plegado conserva el rango
//    [ini, fin) del texto ORIGINAL del que proviene, así el resaltado cae en el lugar exacto aunque la
//    normalización cambie la longitud (NFD, espacios colapsados, comillas tipográficas, etc.).
//  - Nunca se construye una RegExp con texto del usuario: la comparación es por tokens y por igualdad
//    de cadenas, de modo que no existe superficie de ReDoS. Las pocas RegExp internas son constantes.
//  - El HTML se produce escapando SIEMPRE el texto antes de insertar <mark> (protección XSS).

export const RESALTADO_CLIENT_JS = String.raw`
var GS_LIM = { maxChars: 200, maxCriterios: 8, maxTokens: 16, maxLongToken: 40 };
var GS_PALABRAS_DIGITO = { cero: '0', uno: '1', dos: '2', tres: '3', cuatro: '4', cinco: '5', seis: '6', siete: '7', ocho: '8', nueve: '9' };
var GS_DIGITO_PALABRA = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
var GS_VACIAS = { de: 1, del: 1, la: 1, las: 1, el: 1, los: 1, en: 1, y: 1, e: 1, o: 1, u: 1, a: 1, al: 1, un: 1, una: 1, que: 1, por: 1, con: 1, para: 1, se: 1, su: 1, sus: 1, lo: 1 };
var GS_CLAVES_DOC = { decreto: 1, decr: 1, dec: 1, acuerdo: 1, acdo: 1, ley: 1, d: 1 };
var GS_RELLENO_DOC = { no: 1, n: 1, num: 1, nro: 1, numero: 1, legislativo: 1, ejecutivo: 1 };
var GS_COMILLAS = '"“”„«»';
var GS_ESC_HTML = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function gsEscapar(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return GS_ESC_HTML[c]; });
}

/**
 * Pliega el texto: minúsculas, sin diacríticos y con cada racha de espacios reducida a uno.
 * Devuelve el texto plegado y, por cada unidad UTF-16 plegada, el rango [ini, fin) del original.
 */
function gsPlegar(texto) {
  texto = String(texto == null ? '' : texto);
  var out = [], ini = [], fin = [];
  var espera = false, eIni = 0, eFin = 0;
  function emitir(cadena, a, b) {
    for (var u = 0; u < cadena.length; u++) { out.push(cadena.charAt(u)); ini.push(a); fin.push(b); }
  }
  var i = 0;
  while (i < texto.length) {
    var code = texto.charCodeAt(i);
    var largo = 1;
    if (code >= 0xD800 && code <= 0xDBFF && i + 1 < texto.length) {
      var lo = texto.charCodeAt(i + 1);
      if (lo >= 0xDC00 && lo <= 0xDFFF) largo = 2;
    }
    var fin_i = i + largo;
    // Camino rápido ASCII
    if (code < 128) {
      if (code === 32 || (code >= 9 && code <= 13)) {
        if (!espera) { espera = true; eIni = i; }
        eFin = fin_i;
      } else {
        if (espera) { if (out.length > 0) emitir(' ', eIni, eFin); espera = false; }
        var c = code >= 65 && code <= 90 ? code + 32 : code;
        emitir(String.fromCharCode(c), i, fin_i);
      }
      i = fin_i;
      continue;
    }
    var ch = texto.slice(i, fin_i);
    if (/\s/.test(ch)) {
      if (!espera) { espera = true; eIni = i; }
      eFin = fin_i;
    } else if (code === 0xAD || (code >= 0x200B && code <= 0x200F) || code === 0xFEFF || code === 0x2060) {
      // Invisibles (guion blando, ancho cero): se ignoran pero se absorben en el rango previo
      if (fin.length > 0 && !espera) fin[fin.length - 1] = fin_i;
    } else {
      if (espera) { if (out.length > 0) emitir(' ', eIni, eFin); espera = false; }
      var partes = Array.from(ch.normalize('NFD'));
      for (var k = 0; k < partes.length; k++) {
        var p = partes[k];
        if (/\p{M}/u.test(p)) { if (fin.length > 0) fin[fin.length - 1] = fin_i; continue; }
        if (p === '’' || p === '‘' || p === '‛' || p === '´') p = "'";
        else if (p === '“' || p === '”' || p === '„' || p === '«' || p === '»') p = '"';
        else if (p === '–' || p === '—' || p === '−' || p === '‐' || p === '‑') p = '-';
        var bajo = Array.from(p.toLowerCase().normalize('NFD'));
        for (var m = 0; m < bajo.length; m++) {
          if (/\p{M}/u.test(bajo[m])) continue;
          emitir(bajo[m], i, fin_i);
        }
      }
    }
    i = fin_i;
  }
  return { plano: out.join(''), ini: ini, fin: fin };
}

function gsEsPalabra(plano, idx) {
  var c = plano.charCodeAt(idx);
  if ((c >= 97 && c <= 122) || (c >= 48 && c <= 57)) return true;
  if (c < 128) return false;
  return /[\p{L}\p{N}]/u.test(plano.charAt(idx));
}

/** Divide el texto plegado en tokens (rachas de letras o dígitos). Devuelve tokens y sus posiciones plegadas. */
function gsTokenizar(plano) {
  var toks = [], ta = [], tb = [];
  var n = plano.length, i = 0;
  while (i < n) {
    if (!gsEsPalabra(plano, i)) { i++; continue; }
    var j = i + 1;
    while (j < n && gsEsPalabra(plano, j)) j++;
    toks.push(plano.slice(i, j)); ta.push(i); tb.push(j);
    i = j;
  }
  return { toks: toks, ta: ta, tb: tb };
}

/** Prepara un texto para buscar en él: plegado + mapa de posiciones + tokens. Se calcula UNA vez al indexar. */
function gsPrepararSegmento(texto) {
  var f = gsPlegar(texto);
  var t = gsTokenizar(f.plano);
  return { texto: String(texto == null ? '' : texto), plano: f.plano, ini: f.ini, fin: f.fin, toks: t.toks, ta: t.ta, tb: t.tb };
}

function gsFallo(codigo, error) { return { ok: false, codigo: codigo, error: error }; }

function gsEsNumero(t) { return /^[0-9]+$/.test(t); }

/** Si la consulta completa es un DUI (9 dígitos, 6-8 con dígito verificador separado, u 8-9 palabras-dígito) devuelve sus 9 dígitos. */
function gsDuiDesdeConsulta(texto) {
  var s = String(texto).trim().toLowerCase();
  if (/^[0-9\s\-–—]+$/.test(s)) {
    var d = s.replace(/\D/g, '');
    if (d.length === 9) return d;
    if (/^[0-9]{1,8}\s*[-–—\s]\s*[0-9]$/.test(s) && d.length >= 6 && d.length <= 8) return d.padStart(9, '0');
    return null;
  }
  var ws = s.split(/[\s\-–—]+/).filter(function (w) { return w.length > 0; });
  if (ws.length >= 8 && ws.length <= 9 && ws.every(function (w) { return GS_PALABRAS_DIGITO[w] !== undefined; })) {
    var dd = ws.map(function (w) { return GS_PALABRAS_DIGITO[w]; }).join('');
    return dd.length === 8 ? '0' + dd : dd;
  }
  return null;
}

function gsCriterioDui(d9) {
  var palabras = d9.split('').map(function (x) { return GS_DIGITO_PALABRA[Number(x)]; });
  return {
    tipo: 'alt', req: true, etiqueta: 'DUI',
    opciones: [[d9.slice(0, 8), d9.slice(8)], [d9], palabras]
  };
}

/**
 * Analiza la consulta del usuario. Reconoce: términos sueltos (todos deben aparecer), frases exactas
 * entre comillas, números de decreto en cualquier formato ("Decreto No. 690", "decreto 690", "D. 690",
 * "d690") y DUI. Aplica límites estrictos de longitud y de cantidad de términos.
 */
function gsAnalizarConsulta(entrada, lim, dui9) {
  lim = lim || GS_LIM;
  if (typeof entrada !== 'string') return gsFallo('tipo', 'La consulta debe ser un texto.');
  if (entrada.length > lim.maxChars * 10) return gsFallo('larga', 'La consulta admite ' + lim.maxChars + ' caracteres como máximo. Acórtala y vuelve a intentar.');
  var texto = entrada.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!texto) return gsFallo('vacia', 'Escribe un DUI, un nombre, un número de decreto o una frase para buscar en el archivo.');
  if (texto.length > lim.maxChars) return gsFallo('larga', 'La consulta admite ' + lim.maxChars + ' caracteres como máximo. Acórtala y vuelve a intentar.');
  if (texto.length < 3) return gsFallo('corta', 'Escribe al menos 3 caracteres para buscar.');

  var d9 = dui9 || gsDuiDesdeConsulta(texto);
  if (d9) {
    return { ok: true, texto: texto, criterios: [gsCriterioDui(d9)], descripcion: [{ tipo: 'dui', texto: d9.slice(0, 8) + '-' + d9.slice(8) }], dui: d9 };
  }

  // 1) Separar grupos entre comillas y sin comillas
  var grupos = [], cur = '', dentro = false;
  for (var i = 0; i < texto.length; i++) {
    var ch = texto.charAt(i);
    if (GS_COMILLAS.indexOf(ch) >= 0) {
      if (cur.trim()) grupos.push({ q: dentro, raw: cur.trim() });
      cur = ''; dentro = !dentro;
    } else cur += ch;
  }
  if (cur.trim()) grupos.push({ q: dentro, raw: cur.trim() });

  var totalTokens = 0;
  var criterios = [], descripcion = [];
  var palabras = []; // palabras sin comillas: { raw, toks }
  var fraseOrden = []; // todos los tokens sin comillas, en orden (para el bono de frase implícita)
  function tokensDe(raw) {
    var t = gsTokenizar(gsPlegar(raw).plano).toks;
    totalTokens += t.length;
    return t;
  }
  var errorToken = null;
  function revisar(t) {
    for (var x = 0; x < t.length; x++) if (t[x].length > lim.maxLongToken) errorToken = t[x];
  }
  for (var g = 0; g < grupos.length; g++) {
    var gr = grupos[g];
    if (gr.q) {
      var tq = tokensDe(gr.raw); revisar(tq);
      if (tq.length === 0) continue;
      if (tq.length === 1) criterios.push({ tipo: 'termino', t: tq[0], pref: false, req: true });
      else criterios.push({ tipo: 'frase', toks: tq, pref: false, req: true });
      descripcion.push({ tipo: tq.length === 1 ? 'termino' : 'frase', texto: gr.raw });
    } else {
      var ps = gr.raw.split(' ');
      for (var w = 0; w < ps.length; w++) {
        if (!ps[w]) continue;
        var tw = tokensDe(ps[w]); revisar(tw);
        if (tw.length > 0) palabras.push({ raw: ps[w], toks: tw });
      }
    }
    if (totalTokens > lim.maxTokens) break;
  }
  if (errorToken !== null) return gsFallo('token_largo', 'Una de las palabras es demasiado larga (máximo ' + lim.maxLongToken + ' letras). Revisa lo que escribiste.');
  if (totalTokens > lim.maxTokens) return gsFallo('muchos_terminos', 'Escribiste demasiadas palabras: el máximo es ' + lim.maxTokens + '. Usa menos palabras o agrúpalas entre comillas para buscar una frase exacta.');

  // 2) Números de decreto: clave (decreto, d, acuerdo, ley...) + relleno opcional (no, n°, legislativo) + número
  var plano = []; // { t, w }
  for (var a = 0; a < palabras.length; a++) for (var b = 0; b < palabras[a].toks.length; b++) plano.push({ t: palabras[a].toks[b], w: a, usado: false });
  for (var p = 0; p < plano.length; p++) {
    var tk = plano[p].t;
    if (plano[p].usado) continue;
    var pegado = /^(decreto|decr|dec|acuerdo|acdo|ley|d)([0-9]{1,5})$/.exec(tk);
    if (pegado) {
      plano[p].usado = true;
      criterios.push({ tipo: 'decreto', numero: pegado[2], req: true });
      descripcion.push({ tipo: 'decreto', texto: 'Decreto N.º ' + pegado[2] });
      continue;
    }
    if (GS_CLAVES_DOC[tk] === 1) {
      var q = p + 1;
      while (q < plano.length && GS_RELLENO_DOC[plano[q].t] === 1) q++;
      if (q < plano.length && /^[0-9]{1,5}$/.test(plano[q].t)) {
        for (var z = p; z <= q; z++) plano[z].usado = true;
        criterios.push({ tipo: 'decreto', numero: plano[q].t, req: true });
        descripcion.push({ tipo: 'decreto', texto: 'Decreto N.º ' + plano[q].t });
      }
    } else if (GS_RELLENO_DOC[tk] === 1) {
      // "No. 690" sin clave: se descarta el relleno y queda el número como término
      var r = p + 1;
      while (r < plano.length && GS_RELLENO_DOC[plano[r].t] === 1) r++;
      if (r < plano.length && /^[0-9]{1,5}$/.test(plano[r].t)) for (var y = p; y < r; y++) plano[y].usado = true;
    }
  }
  // 3) Palabras restantes: un token = término; varios tokens (p. ej. "s.a.") = frase
  var restantes = [];
  for (var u = 0; u < palabras.length; u++) restantes.push([]);
  for (var v = 0; v < plano.length; v++) if (!plano[v].usado) restantes[plano[v].w].push(plano[v].t);
  var terminosSueltos = [];
  for (var k = 0; k < palabras.length; k++) {
    var rt = restantes[k];
    if (rt.length === 0) continue;
    if (rt.length === 1) {
      var t1 = rt[0];
      fraseOrden.push(t1);
      if (!gsEsNumero(t1) && t1.length < 2) continue;
      terminosSueltos.push({ t: t1, raw: palabras[k].raw });
    } else {
      for (var m = 0; m < rt.length; m++) fraseOrden.push(rt[m]);
      criterios.push({ tipo: 'frase', toks: rt, pref: !gsEsNumero(rt[rt.length - 1]) && rt[rt.length - 1].length >= 3, req: true });
      descripcion.push({ tipo: 'frase', texto: palabras[k].raw });
    }
  }
  var utiles = terminosSueltos.filter(function (x) { return GS_VACIAS[x.t] !== 1; });
  for (var s = 0; s < utiles.length; s++) {
    var tt = utiles[s].t;
    criterios.push({ tipo: 'termino', t: tt, pref: !gsEsNumero(tt) && tt.length >= 3, req: true });
    descripcion.push({ tipo: 'termino', texto: utiles[s].raw });
  }
  var requeridos = criterios.filter(function (c) { return c.req; }).length;
  if (requeridos === 0) return gsFallo('sin_terminos', 'Tu consulta solo tiene palabras muy cortas o comunes (como "de" o "la"). Agrega un nombre, un número o una palabra más específica.');
  if (requeridos > lim.maxCriterios) return gsFallo('muchos_terminos', 'Escribiste demasiados términos distintos: el máximo es ' + lim.maxCriterios + '. Quita alguno o agrúpalos entre comillas.');

  // 4) Bono de frase implícita: los mismos términos juntos y en el mismo orden puntúan más (no se exigen)
  if (fraseOrden.length >= 2 && criterios.every(function (c) { return c.tipo !== 'decreto'; })) {
    criterios.push({ tipo: 'frase', toks: fraseOrden, pref: false, req: false });
  }
  return { ok: true, texto: texto, criterios: criterios, descripcion: descripcion, dui: null };
}

/**
 * Coincidencia de palabra con tolerancia de flexión: la palabra puede llevar hasta 2 letras más que el término
 * (plural, género: "tributaria" -> "tributarias"), pero NO es una búsqueda por prefijo libre: "tránsito" no coincide
 * con "transitoria". Así lo remarcado es siempre la palabra completa que el usuario reconoce como coincidencia.
 */
function gsPrefijo(tok, t) { return tok.length >= t.length && tok.length <= t.length + 2 && tok.lastIndexOf(t, 0) === 0; }

function gsSoloSeparador(plano, a, b) {
  if (b - a > 4) return false;
  for (var i = a; i < b; i++) {
    if (' .-:°º,'.indexOf(plano.charAt(i)) < 0) return false;
  }
  return true;
}

function gsHit(seg, c, a, b, fuerte) {
  return { c: c, a: seg.ini[a], b: seg.fin[b - 1], fuerte: fuerte };
}

function gsSecuencia(seg, i, seq, pref) {
  var k = seq.length;
  if (i + k > seg.toks.length) return false;
  for (var j = 0; j < k; j++) {
    var tk = seg.toks[i + j];
    if (j === k - 1 && pref) { if (!gsPrefijo(tk, seq[j])) return false; }
    else if (tk !== seq[j]) return false;
  }
  return true;
}

/**
 * Localiza todos los criterios dentro de un segmento preparado. Devuelve coincidencias
 * { c: índice de criterio, a, b: rango en el texto ORIGINAL, fuerte: frase/número de decreto }.
 */
function gsLocalizar(seg, criterios) {
  var hits = [];
  var toks = seg.toks, n = toks.length;
  for (var c = 0; c < criterios.length; c++) {
    var cr = criterios[c];
    if (cr.tipo === 'termino') {
      for (var i = 0; i < n; i++) {
        if (cr.pref ? gsPrefijo(toks[i], cr.t) : toks[i] === cr.t) {
          hits.push(gsHit(seg, c, seg.ta[i], seg.tb[i], false));
        }
      }
    } else if (cr.tipo === 'frase') {
      var k = cr.toks.length;
      for (var i2 = 0; i2 + k <= n; i2++) {
        if (gsSecuencia(seg, i2, cr.toks, cr.pref)) {
          var ult = i2 + k - 1;
          hits.push(gsHit(seg, c, seg.ta[i2], seg.tb[ult], true));
        }
      }
    } else if (cr.tipo === 'alt') {
      for (var o = 0; o < cr.opciones.length; o++) {
        var op = cr.opciones[o], ko = op.length;
        for (var i3 = 0; i3 + ko <= n; i3++) {
          if (gsSecuencia(seg, i3, op, false)) hits.push(gsHit(seg, c, seg.ta[i3], seg.tb[i3 + ko - 1], true));
        }
      }
    } else if (cr.tipo === 'decreto') {
      for (var i4 = 0; i4 < n; i4++) {
        var tk = toks[i4];
        if (tk === cr.numero) {
          var j = i4 - 1;
          while (j >= 0 && GS_RELLENO_DOC[toks[j]] === 1 && gsSoloSeparador(seg.plano, seg.tb[j], seg.ta[j + 1])) j--;
          if (j >= 0 && GS_CLAVES_DOC[toks[j]] === 1 && gsSoloSeparador(seg.plano, seg.tb[j], seg.ta[j + 1])) {
            hits.push(gsHit(seg, c, seg.ta[j], seg.tb[i4], true));
          }
        } else {
          var m = /^(decreto|decr|dec|acuerdo|acdo|ley|d)([0-9]{1,5})$/.exec(tk);
          if (m && m[2] === cr.numero) hits.push(gsHit(seg, c, seg.ta[i4], seg.tb[i4], true));
        }
      }
    }
  }
  return hits;
}

/** Une rangos solapados o separados solo por espacios, de modo que "JUAN JOSÉ" salga en una sola marca. */
function gsUnirRangos(rangos, texto) {
  var r = rangos.map(function (x) { return [x[0], x[1]]; }).sort(function (x, y) { return x[0] - y[0] || x[1] - y[1]; });
  var out = [];
  for (var i = 0; i < r.length; i++) {
    var ult = out.length ? out[out.length - 1] : null;
    if (ult && (r[i][0] <= ult[1] || (texto && /^\s+$/.test(texto.slice(ult[1], r[i][0]))))) {
      if (r[i][1] > ult[1]) ult[1] = r[i][1];
    } else out.push(r[i]);
  }
  return out;
}

/** Texto -> HTML seguro: escapa SIEMPRE el texto y solo entonces inserta <mark>. */
function gsResaltarHtml(texto, rangos, clase, atributos) {
  texto = String(texto == null ? '' : texto);
  var abre = '<mark class="' + gsEscapar(clase || 'gs-mark') + '"' + (atributos || '') + '>';
  var html = '', pos = 0;
  for (var i = 0; i < rangos.length; i++) {
    var a = Math.max(pos, rangos[i][0]), b = Math.min(texto.length, rangos[i][1]);
    if (b <= a) continue;
    html += gsEscapar(texto.slice(pos, a)) + abre + gsEscapar(texto.slice(a, b)) + '</mark>';
    pos = b;
  }
  return html + gsEscapar(texto.slice(pos));
}

/** Atajo para el navegador: resalta una consulta completa dentro de un texto. */
function gsResaltarConsulta(texto, consulta, clase, atributos) {
  var an = gsAnalizarConsulta(consulta);
  if (!an.ok) return gsEscapar(texto);
  var seg = gsPrepararSegmento(texto);
  var rangos = gsLocalizar(seg, an.criterios).map(function (h) { return [h.a, h.b]; });
  return gsResaltarHtml(texto, gsUnirRangos(rangos, texto), clase, atributos);
}
`;

// ---- Tipos del núcleo (el código real está en el texto de arriba) ----

export interface SegmentoPreparado {
  texto: string;
  plano: string;
  ini: number[];
  fin: number[];
  toks: string[];
  ta: number[];
  tb: number[];
}

export type Criterio =
  | { tipo: 'termino'; t: string; pref: boolean; req: boolean }
  | { tipo: 'frase'; toks: string[]; pref: boolean; req: boolean }
  | { tipo: 'alt'; opciones: string[][]; req: boolean; etiqueta: string }
  | { tipo: 'decreto'; numero: string; req: boolean };

export interface DescripcionCriterio {
  tipo: 'termino' | 'frase' | 'decreto' | 'dui';
  texto: string;
}

export type ConsultaAnalizada =
  | { ok: true; texto: string; criterios: Criterio[]; descripcion: DescripcionCriterio[]; dui: string | null }
  | { ok: false; codigo: string; error: string };

export interface Coincidencia {
  c: number;
  a: number;
  b: number;
  fuerte: boolean;
}

export interface LimitesConsulta {
  maxChars: number;
  maxCriterios: number;
  maxTokens: number;
  maxLongToken: number;
}

interface Nucleo {
  LIM: LimitesConsulta;
  escapar(s: string): string;
  plegar(texto: string): { plano: string; ini: number[]; fin: number[] };
  tokenizar(plano: string): { toks: string[]; ta: number[]; tb: number[] };
  preparar(texto: string): SegmentoPreparado;
  analizar(entrada: unknown, lim?: LimitesConsulta, dui9?: string): ConsultaAnalizada;
  localizar(seg: SegmentoPreparado, criterios: Criterio[]): Coincidencia[];
  unirRangos(rangos: Array<[number, number]>, texto?: string): Array<[number, number]>;
  resaltarHtml(texto: string, rangos: Array<[number, number]>, clase?: string, atributos?: string): string;
  resaltarConsulta(texto: string, consulta: string, clase?: string, atributos?: string): string;
}

/** Misma lógica que ejecuta el navegador (se construye desde el mismo texto). */
export const nucleo = new Function(`${RESALTADO_CLIENT_JS}; return {
  LIM: GS_LIM, escapar: gsEscapar, plegar: gsPlegar, tokenizar: gsTokenizar, preparar: gsPrepararSegmento,
  analizar: gsAnalizarConsulta, localizar: gsLocalizar, unirRangos: gsUnirRangos,
  resaltarHtml: gsResaltarHtml, resaltarConsulta: gsResaltarConsulta };`)() as Nucleo;

export const LIMITES_CONSULTA: LimitesConsulta = nucleo.LIM;
