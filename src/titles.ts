// Generación de titulares que reflejan el ACTO JURÍDICO de la publicación (no el sumario ni el
// número de inserción "1 v. No. F53866").

const MAYUS = 'A-ZÁÉÍÓÚÑ';
const CONECTORES = new Set(['de', 'del', 'la', 'las', 'los', 'y']);

const plano = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').toLowerCase();

const compacta = (s: string): string => s.replace(/\s+/g, ' ').trim();

/** "OCTAVIO LOPEZ  VIDAL" -> "Octavio Lopez Vidal" (respeta conectores). */
export function nombrePropio(raw: string): string {
  return compacta(raw)
    .split(' ')
    .map((w, i) => {
      const l = w.toLowerCase();
      if (i > 0 && CONECTORES.has(l)) return l;
      return l.charAt(0).toUpperCase() + l.slice(1);
    })
    .join(' ');
}

const OMITIR = new Set([
  'el', 'la', 'los', 'las', 'de', 'del', 'a', 'su', 'defunción', 'defuncion', 'causante', 'señor', 'señora',
  'señorita', 'sr.', 'sra.', 'doña', 'don', 'licenciado', 'licenciada', 'doctor', 'doctora', 'dejó', 'dejo',
  'dejara', 'por', 'que', 'sucesión', 'sucesion', 'herencia', 'intestada', 'testamentaria', 'yacente', 'conocido',
  'conocida', 'definitiva', 'definitivo', 'interina', 'interino', 'con', 'beneficio', 'inventario', 'ab-intestato'
]);
const TOKEN_NOMBRE = /^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ'’-]*[,.;:]?$/;

/** Camina tokens desde un disparador y arma un nombre propio (se detiene en puntuación). */
function leerNombre(tokens: string[]): string | null {
  let i = 0;
  while (i < tokens.length && OMITIR.has(tokens[i]!.toLowerCase().replace(/[,:;]$/, ''))) i++;
  const partes: string[] = [];
  for (; i < tokens.length && partes.length < 7; i++) {
    const tk = tokens[i]!;
    const limpio = tk.replace(/[,.;:]+$/, '');
    const conector = CONECTORES.has(tk.toLowerCase());
    if (conector && partes.length > 0 && i + 1 < tokens.length && TOKEN_NOMBRE.test(tokens[i + 1]!)) {
      partes.push(tk.toLowerCase());
      continue;
    }
    if (!TOKEN_NOMBRE.test(tk) || /^(Conocid|Quien|Que|Fue|Falleci|Dej|Hijo|Hija|Mayor|Soltero|Soltera)/i.test(limpio)) break;
    partes.push(limpio);
    if (/[,.;:]$/.test(tk)) break;
  }
  while (partes.length && CONECTORES.has(partes[partes.length - 1]!)) partes.pop();
  return partes.filter((p) => !CONECTORES.has(p)).length >= 2 ? nombrePropio(partes.join(' ')) : null;
}

/** Extrae el nombre del causante / persona principal de un edicto sucesorio. */
export function extraerCausante(contenido: string): string | null {
  const tokens = compacta(contenido).split(' ');
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!.toLowerCase().replace(/[,.:;]$/, '');
    const dispara =
      t === 'causante' || t === 'dejó' || t === 'dejo' || t === 'dejara' ||
      (t === 'herencia' && /^(?:intestada|testamentaria|yacente|de|del|que)/i.test(tokens[i + 1] ?? ''));
    if (!dispara) continue;
    const nombre = leerNombre(tokens.slice(i + 1, i + 14));
    if (nombre && !/^(Juzgado|Juez|Notari|Documento|Registro|Identidad|Administraci)/.test(nombre)) return nombre;
  }
  return null;
}

const TIPOS_JUZGADO = 'CIVIL Y MERCANTIL|CIVIL|FAMILIA|LABORAL|PAZ|PRIMERA INSTANCIA|MERCANTIL';
const NO_LUGAR = new Set(['ESTA', 'ESTE', 'MUNICIPIO', 'DEPARTAMENTO', 'CON', 'AL', 'PARA', 'QUE', 'EN', 'CONFORME', 'HACE', 'AVISA', 'DEL', 'DE', 'SEDE', 'JUEZ', 'JUEZA', 'UNO', 'DOS', 'TRES', 'Y', 'CIUDAD']);

function juzgadoEn(texto: string): string | null {
  const T = compacta(texto).toUpperCase();
  const re = new RegExp(
    String.raw`(?:JUEZ[A]?|JUZGADO)\s*(?:\(\w+\)\s*)?(PRIMER[OA]|SEGUND[OA]|TERCER[OA]|CUART[OA]|QUINT[OA]|SEXT[OA]|S[ÉE]PTIM[OA]|OCTAV[OA]|ÚNIC[OA])?\s*(?:\(\w+\)\s*)?(?:INTERIN[OA]\s+)?(?:EN\s+FUNCIONES\s+)?(?:DEL\s+JUZGADO\s+)?(?:DE\s+)?(?:LO\s+)?(${TIPOS_JUZGADO})(?:\s*\([^)]{1,5}\))?\s*[,:;]?\s*(?:(?:DE|DEL)\s+)?(?:DISTRITO\s+(?:JUDICIAL\s+)?(?:DE\s+)?)?((?:[A-ZÁÉÍÓÚÑ]+)(?:\s+(?:DE\s+|DEL\s+)?[A-ZÁÉÍÓÚÑ]+){0,2})?`
  );
  const m = T.match(re);
  if (!m) return null;
  const tipo = nombrePropio(m[2]!.toLowerCase()).replace(/ Y /, ' y ');
  const ord = m[1] ? ` ${nombrePropio(m[1])}` : '';
  let lugar = '';
  if (m[3]) {
    const toks: string[] = [];
    for (const w of m[3].split(' ')) {
      if (NO_LUGAR.has(w) && !(w === 'DE' && toks.length > 0)) { if (toks.length === 0) break; else break; }
      toks.push(w);
    }
    while (toks.length && ['DE', 'DEL', 'LA'].includes(toks[toks.length - 1]!) && !(toks.length === 2 && toks[0] === 'LA')) toks.pop();
    if (toks.length === 1 && toks[0] === 'LA') toks.pop();
    if (toks.length) lugar = ` de ${nombrePropio(toks.join(' '))}`;
  }
  return `Juzgado${ord} de lo ${tipo}${lugar}`.replace('de lo Primera Instancia', 'de Primera Instancia');
}

const RUIDO_NOTARIO = new Set(['SUPLETORIO', 'TITULO', 'TÍTULO', 'PROPIEDAD', 'EDICTO', 'AVISO', 'EL', 'LA', 'INFRASCRITO', 'LICDA.', 'LIC.', 'LICENCIADO', 'LICENCIADA', 'AL', 'PÚBLICO', 'PUBLICO', 'SALVADOREÑO']);

function notarioEn(texto: string): string | null {
  const m = /,?\s+(NOTARI[OA])\b/i.exec(texto);
  if (!m) return null;
  const prev = compacta(texto.slice(Math.max(0, m.index - 120), m.index)).split(' ');
  const nombre: string[] = [];
  for (let i = prev.length - 1; i >= 0 && nombre.length < 7; i--) {
    const w = prev[i]!.replace(/[,;:]$/, '');
    if (RUIDO_NOTARIO.has(w) || !/^[A-ZÁÉÍÓÚÑ]{2,}$/.test(w) && !CONECTORES.has(w.toLowerCase())) break;
    if (CONECTORES.has(w.toLowerCase()) && !/^[A-ZÁÉÍÓÚÑ]/.test(w)) break;
    nombre.unshift(w);
  }
  while (nombre.length && CONECTORES.has(nombre[0]!.toLowerCase())) nombre.shift();
  return nombre.length >= 2 ? `${nombrePropio(m[1]!.toLowerCase())} ${nombrePropio(nombre.join(' '))}` : null;
}

/** Autoridad emisora: juzgado, notario, alcaldía o ministerio. */
export function extraerAutoridad(contenido: string): string | null {
  const t = compacta(contenido.replace(/^\s*\d+\s+(?:v\.?\s*)?(?:alt\.?\s*)?No\.\s*\S+\s*/i, ''));
  const cabecera = t.slice(0, 500);
  const juzCab = juzgadoEn(cabecera);
  if (juzCab) return juzCab;
  const notCab = notarioEn(contenido.replace(/^\s*\d+\s+(?:v\.?\s*)?(?:alt\.?\s*)?No\.\s*\S+\s*/i, '').slice(0, 500));
  if (notCab) return notCab;
  const alc = t.match(/Alcald[íi]a\s+Municipal\s+de\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})/);
  if (alc) return `Alcaldía Municipal de ${alc[1]}`;
  const min = t.match(/Ministerio\s+de\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+(?:y\s+)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})/);
  if (min) return `Ministerio de ${min[1]}`;
  return juzgadoEn(t.slice(500));
}

/** Acto jurídico principal según el contenido. */
export function detectarActo(contenido: string): string {
  const t = plano(contenido);
  const tipo = /intestad/.test(t) ? ' intestada' : /testamentari/.test(t) ? ' testamentaria' : '';
  if (/(heredero|heredera|herederos|herederas)\s+definitiv|declar\w*\s+(?:a\s+)?(?:los\s+)?(?:heredero|herederos)/.test(t)) {
    return 'Declaratoria de heredero definitivo';
  }
  if (/titulo supletorio|titulacion supletoria/.test(t)) return 'Título supletorio';
  if (/titulo (de propiedad|de dominio|municipal)/.test(t)) return 'Título municipal de dominio';
  if (/delimitacion/.test(t)) return 'Delimitación de derecho de propiedad';
  if (/muerte presunta/.test(t)) return 'Declaratoria de muerte presunta';
  if (/reposicion de|reposicion del|extravio/.test(t)) return 'Reposición de documento';
  if (/convocatoria/.test(t)) return /junta general/.test(t) ? 'Convocatoria a junta general' : 'Convocatoria';
  if (/aceptacion de herencia|beneficio de inventario|aceptad[oa]\s+expresamente/.test(t)) {
    return `Aceptación de herencia${tipo}`;
  }
  if (/herencia yacente|curador/.test(t)) return 'Herencia yacente (nombramiento de curador)';
  if (/balance|estado de resultados/.test(t)) return 'Balance y estados financieros';
  if (/disolucion|liquidacion/.test(t)) return 'Disolución y liquidación de sociedad';
  if (/rectificacion|marginacion|asiento de defuncion/.test(t)) return 'Rectificación de partida';
  if (/nombramiento|auditor/.test(t)) return 'Nombramiento de auditor';
  if (/sociedad/.test(t)) return 'Aviso de sociedad';
  if (/emplaza|citacion/.test(t)) return 'Emplazamiento';
  if (/herencia|sucesion|causante/.test(t)) return 'Edicto de sucesión';
  return 'Edicto judicial';
}

/** Recorta en límite de palabra sin dejar preposiciones colgantes. */
export function recortar(s: string, max = 160): string {
  if (s.length <= max) return s;
  let corte = s.slice(0, max - 1).replace(/\s+\S*$/, '');
  corte = corte.replace(/(?:\s+(?:de|del|la|las|los|el|y|en|a))+$/i, '');
  return `${corte}…`;
}

/** Titular final: "<Acto> · <Persona> — <Autoridad>". Sin números de inserción ni saltos de línea. */
export function construirTitular(contenido: string, opts: { esLegislativo?: boolean; titularActual?: string } = {}): string {
  if (opts.esLegislativo && opts.titularActual) return compacta(opts.titularActual);
  const acto = detectarActo(contenido);
  const persona = /sucesi|herencia|heredero|causante|curador/i.test(contenido) ? extraerCausante(contenido) : null;
  const autoridad = extraerAutoridad(contenido);
  let t = acto;
  if (persona) t += ` · ${persona}`;
  if (autoridad) t += ` — ${autoridad}`;
  return recortar(t);
}
