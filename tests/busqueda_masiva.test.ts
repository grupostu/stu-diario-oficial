// Búsqueda masiva automática: miles de consultas generadas DESDE el corpus real (src/data_diario_real.json).
// Para cada consulta, el registro de origen DEBE aparecer en los resultados y las marcas <mark> deben cubrir
// únicamente texto que realmente coincide con la consulta. Semilla fija: resultados reproducibles.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { DiarioRecord } from '../src/types.js';
import { DiarioIndex } from '../src/indexer.js';
import { normalizeDuiInput, duiToWords, extractDuis } from '../src/parser.js';
import { dehyphenate } from '../src/text_clean.js';

const corpus: DiarioRecord[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'data_diario_real.json'), 'utf8'));
const indice = new DiarioIndex();
indice.addBatch(structuredClone(corpus));

// ---------------------------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------------------------
function prng(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = prng(20261023);
function muestra<T>(lista: T[], n: number): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  }
  return copia.slice(0, n);
}
const plegar = (s: string): string => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const tokensDe = (s: string): string[] => plegar(s).match(/[\p{L}\p{N}]+/gu) ?? [];
const sinTildes = (s: string): string => s.normalize('NFD').replace(/\p{M}/gu, '');
function decodificar(s: string): string {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}
const PALABRA_DIGITO = new Set(['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']);
const VACIAS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'en', 'y', 'e', 'o', 'u', 'a', 'al', 'un', 'una', 'que', 'por', 'con', 'para', 'se', 'su', 'sus', 'lo']);
const CLAVES_DOC = new Set(['decreto', 'decr', 'dec', 'acuerdo', 'acdo', 'ley', 'd']);
const RELLENO_DOC = new Set(['no', 'n', 'num', 'nro', 'numero', 'legislativo', 'ejecutivo']);

/** Párrafos del contenido con los espacios compactados (así los ve el buscador). */
function parrafos(rec: DiarioRecord): string[] {
  // Se parte del texto con las palabras de fin de línea reconstruidas, igual que lo indexa el buscador
  return dehyphenate(rec.contenido.replace(/\r\n?/g, '\n'))
    .split(/\n[ \t]*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

type Tipo =
  | 'persona-completa' | 'persona-parcial' | 'persona-minusculas' | 'persona-sin-tildes'
  | 'dui-numero' | 'dui-sin-guion' | 'dui-letras'
  | 'decreto' | 'palabra' | 'palabra-guionada' | 'frase' | 'frase-entrecomillada' | 'notario-juez';

interface Consulta {
  tipo: Tipo;
  q: string;
  origen: string;
  /** 'terminos' = cada marca debe ser una palabra de la consulta; 'frase' = además contigua; 'dui'; 'decreto'. */
  modo: 'terminos' | 'frase' | 'dui' | 'decreto';
  /** Tokens (plegados) que la consulta pide. */
  toks: string[];
}

const consultas: Consulta[] = [];
const vistas = new Set<string>();
function agregar(c: Consulta): void {
  const clave = `${c.origen}|${c.q}`;
  if (vistas.has(clave)) return;
  vistas.add(clave);
  consultas.push(c);
}

// ---------------------------------------------------------------------------------------------
// 1) Personas: rachas de palabras capitalizadas / en mayúsculas (dentro de un mismo párrafo)
// ---------------------------------------------------------------------------------------------
const CAP = String.raw`(?<![\p{L}\p{N}])\p{Lu}[\p{L}'’]{2,}(?![\p{L}\p{N}])`;
const RE_NOMBRE = new RegExp(String.raw`${CAP}(?: (?:de |del |de la |y )?${CAP}){1,3}`, 'gu');
const RE_ROL = new RegExp(
  String.raw`\b(?:Licenciad[oa]|LICENCIAD[OA]|Notario|NOTARIO|Doctor[a]?|DOCTOR[A]?|Juez[a]?|JUEZ[A]?|Magistrad[oa]|MAGISTRAD[OA]|Secretari[oa]|SECRETARI[OA])(?: (?:de|DE) [\p{L}]+)? (${CAP}(?: (?:de |del |de la |DE |DEL |DE LA )?${CAP}){1,3})`,
  'gu'
);
const PALABRAS_NO_NOMBRE = new Set(['diario', 'oficial', 'tomo', 'numero', 'san', 'salvador', 'presente', 'ministerio', 'republica', 'juzgado', 'cámara']);

const nombresPorRecord: Array<{ rec: DiarioRecord; nombre: string }> = [];
const notariosPorRecord: Array<{ rec: DiarioRecord; nombre: string }> = [];
for (const rec of corpus) {
  const vistos = new Set<string>();
  for (const p of parrafos(rec)) {
    for (const m of p.matchAll(RE_NOMBRE)) {
      const n = m[0];
      if (n.length > 60 || vistos.has(n)) continue;
      if (tokensDe(n).some((t) => PALABRAS_NO_NOMBRE.has(t))) continue;
      vistos.add(n);
      nombresPorRecord.push({ rec, nombre: n });
    }
    for (const m of p.matchAll(RE_ROL)) {
      if (m[1] && m[1].length <= 60) notariosPorRecord.push({ rec, nombre: m[1] });
    }
  }
}

for (const { rec, nombre } of muestra(nombresPorRecord, 700)) {
  const toks = tokensDe(nombre);
  agregar({ tipo: 'persona-completa', q: nombre, origen: rec.id, modo: 'terminos', toks });
  agregar({ tipo: 'persona-minusculas', q: nombre.toLowerCase(), origen: rec.id, modo: 'terminos', toks });
  agregar({ tipo: 'persona-sin-tildes', q: sinTildes(nombre).toUpperCase(), origen: rec.id, modo: 'terminos', toks });
  const palabras = nombre.split(' ').filter((w) => !VACIAS.has(w.toLowerCase()));
  if (palabras.length >= 3) {
    // Parcial: primer nombre + último apellido; y solo el apellido final
    agregar({ tipo: 'persona-parcial', q: `${palabras[0]} ${palabras[palabras.length - 1]}`, origen: rec.id, modo: 'terminos', toks: tokensDe(`${palabras[0]} ${palabras[palabras.length - 1]}`) });
  }
  agregar({ tipo: 'persona-parcial', q: palabras[palabras.length - 1]!, origen: rec.id, modo: 'terminos', toks: tokensDe(palabras[palabras.length - 1]!) });
  // Nombre completo entrecomillado: debe marcar el nombre completo, contiguo
  agregar({ tipo: 'persona-completa', q: `"${nombre}"`, origen: rec.id, modo: 'frase', toks });
}

for (const { rec, nombre } of muestra(notariosPorRecord, 400)) {
  const toks = tokensDe(nombre);
  agregar({ tipo: 'notario-juez', q: nombre, origen: rec.id, modo: 'terminos', toks });
  agregar({ tipo: 'notario-juez', q: `"${nombre}"`, origen: rec.id, modo: 'frase', toks });
}

// ---------------------------------------------------------------------------------------------
// 2) DUI: en número (con y sin guion, con espacio) y en letras notariales
// ---------------------------------------------------------------------------------------------
const duiTodos: Array<{ rec: DiarioRecord; dui: string }> = [];
for (const rec of corpus) {
  // Se vuelve a extraer del texto (parser) además de lo almacenado, para no depender solo del campo guardado
  const set = new Set([...rec.duisEncontrados, ...extractDuis(rec.contenido)]);
  for (const d of set) if (/^\d{8}-\d$/.test(d)) duiTodos.push({ rec, dui: d });
}
for (const { rec, dui } of duiTodos) {
  const dig = dui.replace('-', '');
  agregar({ tipo: 'dui-numero', q: dui, origen: rec.id, modo: 'dui', toks: [dig] });
  agregar({ tipo: 'dui-sin-guion', q: dig, origen: rec.id, modo: 'dui', toks: [dig] });
  agregar({ tipo: 'dui-sin-guion', q: `${dig.slice(0, 8)} ${dig.slice(8)}`, origen: rec.id, modo: 'dui', toks: [dig] });
  agregar({ tipo: 'dui-letras', q: duiToWords(dui), origen: rec.id, modo: 'dui', toks: [dig] });
  agregar({ tipo: 'dui-letras', q: duiToWords(dui).toLowerCase(), origen: rec.id, modo: 'dui', toks: [dig] });
}

// ---------------------------------------------------------------------------------------------
// 3) Números de decreto / acuerdo
// ---------------------------------------------------------------------------------------------
const RE_DOC = /\b(Decreto|DECRETO|Acuerdo|ACUERDO)(?: (?:Legislativo|Ejecutivo|LEGISLATIVO|EJECUTIVO))? (?:No\.?|N\.?[°º]|Nº|número|NÚMERO|NUMERO) ?(\d{1,5})\b/g;
const docs: Array<{ rec: DiarioRecord; clave: string; numero: string }> = [];
for (const rec of corpus) {
  const visto = new Set<string>();
  for (const fuente of [rec.titular, ...parrafos(rec)]) {
    for (const m of fuente.matchAll(RE_DOC)) {
      const k = `${m[1]!.toLowerCase()}|${m[2]}`;
      if (visto.has(k)) continue;
      visto.add(k);
      docs.push({ rec, clave: m[1]!.toLowerCase(), numero: m[2]! });
    }
  }
}
for (const { rec, clave, numero } of docs) {
  const toks = [numero];
  agregar({ tipo: 'decreto', q: `${clave} ${numero}`, origen: rec.id, modo: 'decreto', toks });
  agregar({ tipo: 'decreto', q: `${clave} No. ${numero}`, origen: rec.id, modo: 'decreto', toks });
  agregar({ tipo: 'decreto', q: `${clave.toUpperCase()} N° ${numero}`, origen: rec.id, modo: 'decreto', toks });
  if (clave === 'decreto') agregar({ tipo: 'decreto', q: `D. ${numero}`, origen: rec.id, modo: 'decreto', toks });
}

// ---------------------------------------------------------------------------------------------
// 4) Palabras sueltas
// ---------------------------------------------------------------------------------------------
const palabrasPorRecord: Array<{ rec: DiarioRecord; palabra: string }> = [];
for (const rec of corpus) {
  const set = new Set<string>();
  for (const p of parrafos(rec)) for (const w of p.match(/[\p{L}][\p{L}]{3,30}/gu) ?? []) if (!VACIAS.has(plegar(w))) set.add(w);
  const arr = [...set];
  for (const w of muestra(arr, 6)) palabrasPorRecord.push({ rec, palabra: w });
}
for (const { rec, palabra } of muestra(palabrasPorRecord, 900)) {
  agregar({ tipo: 'palabra', q: palabra, origen: rec.id, modo: 'terminos', toks: tokensDe(palabra) });
  agregar({ tipo: 'palabra', q: palabra.toUpperCase(), origen: rec.id, modo: 'terminos', toks: tokensDe(palabra) });
  agregar({ tipo: 'palabra', q: sinTildes(palabra).toLowerCase(), origen: rec.id, modo: 'terminos', toks: tokensDe(palabra) });
}

// ---------------------------------------------------------------------------------------------
// 4b) Palabras partidas por guion al final de línea en el PDF (DEPARTA- / MENTO): se buscan ENTERAS
// ---------------------------------------------------------------------------------------------
for (const rec of corpus) {
  const vistos = new Set<string>();
  for (const m of rec.contenido.matchAll(/([\p{L}]{2,})-[ \t]*\n[ \t]*(\p{Ll}[\p{L}]*)/gu)) {
    const entera = m[1]! + m[2]!;
    if (vistos.has(entera) || entera.length > 30) continue;
    vistos.add(entera);
    agregar({ tipo: 'palabra-guionada', q: entera, origen: rec.id, modo: 'terminos', toks: tokensDe(entera) });
    agregar({ tipo: 'palabra-guionada', q: entera.toUpperCase(), origen: rec.id, modo: 'terminos', toks: tokensDe(entera) });
  }
}

// ---------------------------------------------------------------------------------------------
// 5) Frases literales de 3 a 6 palabras (dentro de una oración, sin puntuación intermedia)
// ---------------------------------------------------------------------------------------------
const frasesPorRecord: Array<{ rec: DiarioRecord; frase: string }> = [];
for (const rec of corpus) {
  const cand: string[] = [];
  for (const p of parrafos(rec)) {
    // Rachas de palabras separadas por un solo espacio (sin puntuación intermedia)
    for (const racha of p.match(/[\p{L}\p{N}]+(?: [\p{L}\p{N}]+){2,}/gu) ?? []) {
      const ws = racha.split(' ');
      const n = 3 + Math.floor(rnd() * 4);
      if (ws.length < n) continue;
      const ini = Math.floor(rnd() * (ws.length - n + 1));
      const f = ws.slice(ini, ini + n);
      if (f.every((w) => VACIAS.has(plegar(w)))) continue;
      if (f.filter((w) => !VACIAS.has(plegar(w))).length < 1) continue;
      cand.push(f.join(' '));
    }
  }
  for (const f of muestra(cand, 4)) frasesPorRecord.push({ rec, frase: f });
}
const adornos: Array<(f: string) => string> = [
  (f) => f,
  (f) => f.toLowerCase(),
  (f) => f.toUpperCase(),
  (f) => sinTildes(f).toLowerCase(),
  (f) => `${f},`,
  (f) => `(${f}).`
];
for (const { rec, frase } of muestra(frasesPorRecord, 700)) {
  const toks = tokensDe(frase);
  // Si hay más de 8 palabras útiles distintas el buscador rechaza la consulta; las frases miden ≤ 6.
  for (const ad of adornos) agregar({ tipo: 'frase', q: ad(frase), origen: rec.id, modo: 'terminos', toks });
  agregar({ tipo: 'frase-entrecomillada', q: `"${frase}"`, origen: rec.id, modo: 'frase', toks });
  agregar({ tipo: 'frase-entrecomillada', q: `"${sinTildes(frase).toUpperCase()}"`, origen: rec.id, modo: 'frase', toks });
}

// ---------------------------------------------------------------------------------------------
// Verificación
// ---------------------------------------------------------------------------------------------
interface Fallo {
  tipo: Tipo;
  q: string;
  origen: string;
  motivo: string;
}

/** ¿El token marcado es una palabra que la consulta pidió (con la tolerancia de flexión del motor: +2 letras)? */
function tokenEsPedido(tok: string, c: Consulta): boolean {
  if (c.modo === 'dui') return /^\d+$/.test(tok) || PALABRA_DIGITO.has(tok);
  if (c.modo === 'decreto') return tok === c.toks[0] || CLAVES_DOC.has(tok) || RELLENO_DOC.has(tok) || new RegExp(`^(decreto|decr|dec|acuerdo|acdo|ley|d)${c.toks[0]}$`).test(tok);
  return c.toks.some((q) => tok === q || (tok.startsWith(q) && tok.length <= q.length + 2 && q.length >= 3 && !/^\d+$/.test(q)));
}

function verificar(c: Consulta): string | null {
  const r = indice.buscar({ q: c.q, pagina: 1, porPagina: 5000 });
  const res = r.resultados.find((x) => x.id === c.origen);
  if (!res) {
    return `el registro de origen no está en los resultados (total=${r.total}${r.aviso ? `, aviso="${r.aviso}"` : ''})`;
  }
  const htmls = [...res.coincidencias.map((f) => f.html), res.cabecera.tipoHtml, res.cabecera.numeroHtml, res.cabecera.tituloHtml, res.cabecera.organoHtml, res.cabecera.fechaHtml].filter(
    (h): h is string => typeof h === 'string'
  );
  let marcas = 0;
  for (const html of htmls) {
    for (const m of html.matchAll(/<mark\b[^>]*>([\s\S]*?)<\/mark>/g)) {
      marcas++;
      const texto = decodificar(m[1]!);
      const toks = tokensDe(texto);
      if (toks.length === 0) return `marca vacía o sin palabras: «${texto}»`;
      const mala = toks.find((t) => !tokenEsPedido(t, c));
      if (mala !== undefined) return `marca cubre texto que no coincide: «${texto}» (palabra «${mala}»)`;
      if (c.modo === 'frase') {
        // La marca debe ser una subsecuencia contigua de la frase pedida (con +2 letras de flexión en la última)
        const n = c.toks.length;
        let ok = false;
        for (let i = 0; i + toks.length <= n && !ok; i++) {
          ok = toks.every((t, j) => t === c.toks[i + j]);
        }
        if (!ok) return `marca de frase no contigua con la consulta: «${texto}»`;
      }
    }
    // El HTML sin etiquetas debe ser texto escapado (nunca etiquetas ajenas)
    const sinMarcas = html.replace(/<\/?mark\b[^>]*>/g, '');
    if (/[<>]/.test(sinMarcas)) return `HTML con etiquetas inesperadas: ${sinMarcas.slice(0, 80)}`;
  }
  const aproximada = res.coincidencias.every((f) => f.aproximada);
  if (marcas === 0 && !(c.modo === 'dui' && aproximada)) return 'el registro de origen aparece pero sin ninguna marca <mark>';
  const orig = corpus.find((x) => x.id === c.origen)!;
  // El texto de cada fragmento debe existir en el registro original (plegado)
  const base = plegar([orig.titular, orig.seccion, dehyphenate(orig.contenido), ...orig.nombresClave].join(' ')).replace(/\s+/g, ' ');
  for (const f of res.coincidencias) {
    if (f.ubicacion !== 'cuerpo') continue;
    const trozo = plegar(f.texto).replace(/\s+/g, ' ').trim();
    if (trozo && !base.includes(trozo)) return `fragmento que no existe en el registro: «${f.texto.slice(0, 60)}»`;
  }
  return null;
}

describe('Búsqueda masiva: consultas generadas automáticamente desde el corpus real', () => {
  it('el corpus aporta consultas de todas las familias y al menos 3000 en total', () => {
    const por = new Map<string, number>();
    for (const c of consultas) por.set(c.tipo, (por.get(c.tipo) ?? 0) + 1);
    assert.ok(consultas.length >= 3000, `solo ${consultas.length} consultas`);
    for (const t of ['persona-completa', 'persona-parcial', 'palabra-guionada', 'dui-numero', 'dui-sin-guion', 'dui-letras', 'decreto', 'palabra', 'frase', 'frase-entrecomillada', 'notario-juez'] as Tipo[]) {
      assert.ok((por.get(t) ?? 0) >= 10, `familia ${t} con solo ${por.get(t) ?? 0} consultas`);
    }
  });

  it('0 fallas: el origen aparece y las marcas solo cubren texto coincidente', () => {
    const fallos: Fallo[] = [];
    const porTipo = new Map<string, { n: number; ok: number }>();
    for (const c of consultas) {
      let motivo: string | null;
      try {
        motivo = verificar(c);
      } catch (e) {
        motivo = `excepción: ${(e as Error).message}`;
      }
      const s = porTipo.get(c.tipo) ?? { n: 0, ok: 0 };
      s.n++;
      if (motivo === null) s.ok++;
      else fallos.push({ tipo: c.tipo, q: c.q, origen: c.origen, motivo });
      porTipo.set(c.tipo, s);
    }
    const aciertos = consultas.length - fallos.length;
    const lineas = [...porTipo.entries()].map(([t, s]) => `  ${t.padEnd(22)} ${s.ok}/${s.n}`);
    console.log(`\nBúsqueda masiva: ${consultas.length} consultas, ${aciertos} aciertos (${((aciertos / consultas.length) * 100).toFixed(2)} %)\n${lineas.join('\n')}`);
    if (fallos.length) {
      console.log(`FALLOS (${fallos.length}), primeros 60:`);
      for (const f of fallos.slice(0, 60)) console.log(`  [${f.tipo}] q=${JSON.stringify(f.q)} origen=${f.origen} -> ${f.motivo}`);
    }
    assert.equal(fallos.length, 0, `${fallos.length} consultas fallaron`);
  });

  it('un DUI inventado (dígitos válidos pero ausentes del corpus) no devuelve resultados', () => {
    const todos = new Set(duiTodos.map((d) => d.dui.replace('-', '')));
    let probados = 0;
    for (let i = 0; i < 300 && probados < 100; i++) {
      const base = String(Math.floor(rnd() * 1e8)).padStart(8, '0');
      let suma = 0;
      for (let k = 0; k < 8; k++) suma += Number(base[k]) * (9 - k);
      const dui = base + String((10 - (suma % 10)) % 10);
      if (todos.has(dui) || !normalizeDuiInput(dui).isValidDui) continue;
      probados++;
      assert.equal(indice.buscar({ q: dui }).total, 0, dui);
    }
    assert.ok(probados >= 50);
  });
});
