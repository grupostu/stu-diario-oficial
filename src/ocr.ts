import { renderPaginaBase } from './pagina_base.js';
// Texto reconocido automáticamente (OCR) de las páginas del PDF que no tienen capa de texto.
//
// REGLAS (no negociables):
//  - El texto OCR vive en su propio archivo (public/data/ocr-<id>.json) con origen «ocr». Jamás se escribe en
//    public/data/paginas-<id>.json (texto oficial del PDF) ni en src/data_diario_real.json (publicaciones indexadas).
//  - El buscador y las alertas NO lo indexan: solo se muestra en una vista aparte, con la etiqueta visible
//    «Reconocido automáticamente, puede contener errores».
//  - Solo se reconoce una página que, según el propio PDF, no tiene capa de texto. Nunca se simula ni se inventa texto.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import crypto from 'node:crypto';
import { escapeHtml } from './html.js';

const execFileAsync = promisify(execFile);

/** Etiqueta obligatoria y visible junto a cualquier texto OCR. */
export const ETIQUETA_OCR = 'Reconocido automáticamente, puede contener errores';

/** Marca de origen del texto OCR (distinta del texto oficial del PDF). */
export const ORIGEN_OCR = 'ocr' as const;

/** Una página con cuerpo de menos de estos caracteres (sin cabecera ni pie) se considera sin capa de texto… */
export const MAX_CARACTERES_CUERPO_SIN_TEXTO = 80;
/** …siempre que una imagen cubra al menos esta fracción de la página (es un escaneo). */
export const MIN_COBERTURA_ESCANEO = 0.5;

/** Decide si una página es un escaneo sin capa de texto, a partir de lo medido en el PDF. */
export function esPaginaSinCapaDeTexto(caracteresCuerpo: number, coberturaImagenMayor: number): boolean {
  return caracteresCuerpo < MAX_CARACTERES_CUERPO_SIN_TEXTO && coberturaImagenMayor >= MIN_COBERTURA_ESCANEO;
}

export interface PaginaOcr {
  /** Texto devuelto por el motor, sin ninguna edición posterior. */
  texto: string;
  /** Imagen que se entregó al motor (la del PDF), para poder repetir la lectura. */
  imagen: { ancho: number; alto: number; sha256: string };
}

export interface ArchivoOcr {
  origen: typeof ORIGEN_OCR;
  etiqueta: typeof ETIQUETA_OCR;
  diarioId: string;
  /** Huella del PDF del que salen las páginas: el OCR queda atado a ese archivo exacto. */
  pdfSha256: string;
  motor: { nombre: string; version: string; idioma: string };
  generado: string;
  /** Clave = número de página (1-based) en el PDF. */
  paginas: Record<string, PaginaOcr>;
}

const SHA256 = /^[0-9a-f]{64}$/;
const ID_DIARIO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Valida un archivo OCR contra lo que el PDF declara. Devuelve la lista de problemas (vacía = válido).
 * @param paginasSinTexto páginas del PDF sin capa de texto, tal como las midió construir_corpus.ts
 * @param totalPaginas    número de páginas del PDF
 * @param pdfSha256       huella del PDF del catálogo (si se conoce)
 */
export function validarArchivoOcr(a: unknown, opts: { paginasSinTexto: number[]; totalPaginas: number; pdfSha256?: string; diarioId?: string }): string[] {
  const errores: string[] = [];
  if (!a || typeof a !== 'object') return ['El archivo OCR no es un objeto'];
  const x = a as Record<string, unknown>;
  if (x.origen !== ORIGEN_OCR) errores.push(`origen debe ser «${ORIGEN_OCR}»`);
  if (x.etiqueta !== ETIQUETA_OCR) errores.push('falta la etiqueta obligatoria «' + ETIQUETA_OCR + '»');
  if (typeof x.diarioId !== 'string' || !ID_DIARIO.test(x.diarioId)) errores.push('diarioId inválido');
  else if (opts.diarioId && x.diarioId !== opts.diarioId) errores.push('diarioId no coincide con el diario');
  if (typeof x.pdfSha256 !== 'string' || !SHA256.test(x.pdfSha256)) errores.push('pdfSha256 inválido');
  else if (opts.pdfSha256 && x.pdfSha256 !== opts.pdfSha256) errores.push('pdfSha256 no coincide con el PDF del catálogo');
  const m = x.motor as Record<string, unknown> | undefined;
  if (!m || typeof m.nombre !== 'string' || !m.nombre || typeof m.version !== 'string' || !m.version || typeof m.idioma !== 'string') errores.push('motor sin nombre, versión o idioma');
  if (typeof x.generado !== 'string' || Number.isNaN(Date.parse(x.generado))) errores.push('generado debe ser una fecha ISO');
  const paginas = x.paginas;
  if (!paginas || typeof paginas !== 'object' || Array.isArray(paginas)) {
    errores.push('paginas debe ser un objeto');
    return errores;
  }
  for (const [k, v] of Object.entries(paginas as Record<string, unknown>)) {
    const n = Number(k);
    if (!/^[1-9]\d{0,3}$/.test(k) || n > opts.totalPaginas) {
      errores.push(`página ${k} fuera del diario`);
      continue;
    }
    // Nunca se mezcla OCR con páginas que sí tienen texto oficial.
    if (!opts.paginasSinTexto.includes(n)) errores.push(`la página ${n} tiene capa de texto en el PDF: no se admite OCR sobre ella`);
    const p = v as Record<string, unknown>;
    if (!p || typeof p.texto !== 'string') errores.push(`página ${n}: texto ausente`);
    const im = p?.imagen as Record<string, unknown> | undefined;
    if (!im || !Number.isInteger(im.ancho) || !Number.isInteger(im.alto) || typeof im.sha256 !== 'string' || !SHA256.test(im.sha256)) errores.push(`página ${n}: falta la huella de la imagen reconocida`);
  }
  return errores;
}

function raizDatos(): string[] {
  const aqui = path.dirname(fileURLToPath(import.meta.url));
  return [path.join(aqui, '../public/data'), path.join(process.cwd(), 'public/data'), path.join(aqui, 'public/data')];
}

/** Carga el OCR de un diario (o null si no existe o es inválido). Solo para mostrarlo: nunca se indexa. */
export function cargarOcr(diarioId: string, carpeta?: string): ArchivoOcr | null {
  if (!ID_DIARIO.test(diarioId)) return null;
  const candidatos = (carpeta ? [carpeta] : raizDatos()).map((d) => path.join(d, `ocr-${diarioId}.json`));
  const archivo = candidatos.find((p) => fs.existsSync(p));
  if (!archivo) return null;
  try {
    const a = JSON.parse(fs.readFileSync(archivo, 'utf8')) as ArchivoOcr;
    // Validación mínima de seguridad en lectura: origen y etiqueta presentes.
    if (a.origen !== ORIGEN_OCR || a.etiqueta !== ETIQUETA_OCR || a.diarioId !== diarioId) return null;
    return a;
  } catch {
    return null;
  }
}

const escapar = escapeHtml;

export interface DatosVistaOcr {
  diarioId: string;
  tomo: number;
  numero: number;
  fecha: string;
  pagina: number;
  pdf: string;
  /** true si la página no tiene capa de texto en el PDF. */
  sinCapaDeTexto: boolean;
  ocr: { pagina: PaginaOcr; motor: ArchivoOcr['motor']; generado: string } | null;
}

/** Vista aparte del texto reconocido: etiqueta siempre visible, sin mezclarse con el texto oficial. */
export function renderVistaOcr(d: DatosVistaOcr): string {
  const titulo = `Diario Oficial · Tomo ${d.tomo}, N.° ${d.numero} · ${d.fecha} · pág. ${d.pagina}`;
  const cuerpo = d.ocr
    ? `<p class="etiqueta" role="note"><strong>${escapar(ETIQUETA_OCR)}.</strong> Este texto lo produjo un programa a partir de la imagen de la página; no es el texto oficial ni una transcripción revisada. Compáralo siempre con el PDF original.</p>
  <pre lang="es" aria-label="Texto reconocido automáticamente de la página ${d.pagina}">${escapar(d.ocr.pagina.texto)}</pre>
  <p class="meta">Motor: ${escapar(d.ocr.motor.nombre)} ${escapar(d.ocr.motor.version)} · idioma ${escapar(d.ocr.motor.idioma)} · generado ${escapar(d.ocr.generado)}</p>`
    : `<p class="etiqueta" role="note">${d.sinCapaDeTexto ? 'Esta página es una imagen sin texto digital en el PDF y todavía no tiene texto reconocido automáticamente.' : 'Esta página tiene texto digital en el PDF; no se aplica reconocimiento automático.'}</p>`;
  return renderPaginaBase({
    titulo: `Texto reconocido automáticamente · ${titulo}`,
    noindex: true,
    cuerpo: `<div class="contenido">
  <style>
    .etiqueta{border:1px solid var(--gs-warning-border);background:var(--gs-warning-soft);padding:12px 14px;border-radius:8px;color:var(--gs-warning-soft-ink)}
    pre{white-space:pre-wrap;word-break:break-word;background:var(--gs-surface);color:var(--gs-text);border:1px dashed var(--gs-border-strong);padding:16px;border-radius:8px;font:14px/1.6 var(--gs-font-mono,ui-monospace,monospace)}
    .meta{color:var(--gs-text-3);font-size:.85rem}
  </style>
  <p><a href="/">&larr; Volver al buscador</a> · <a href="${escapar(d.pdf)}#page=${d.pagina}" rel="noopener">Abrir la página en el PDF original</a></p>
  <h1>${escapar(titulo)}</h1>
  ${cuerpo}
</div>`
  });
}

/** Guarda un archivo OCR en la carpeta pública correspondiente. */
export function guardarOcr(archivo: ArchivoOcr, carpeta?: string): string {
  const dir = carpeta ?? path.join(process.cwd(), 'public/data');
  fs.mkdirSync(dir, { recursive: true });
  const destino = path.join(dir, `ocr-${archivo.diarioId}.json`);
  fs.writeFileSync(destino, JSON.stringify(archivo, null, 1) + '\n', 'utf8');
  return destino;
}

export interface InfoMotorOcr {
  nombre: string;
  version: string;
  idioma: string;
  disponible: boolean;
  detalle?: string;
}

export interface AdaptadorOcr {
  inspeccionar(): Promise<InfoMotorOcr>;
  reconocer(png: Buffer, opts?: { idioma?: string }): Promise<string>;
}

/** Adaptador para Tesseract CLI local (tesseract en PATH). */
export class TesseractCliAdaptador implements AdaptadorOcr {
  private binario: string;

  constructor(binario = 'tesseract') {
    this.binario = binario;
  }

  async inspeccionar(): Promise<InfoMotorOcr> {
    try {
      const { stdout } = await execFileAsync(this.binario, ['--version'], { encoding: 'utf8' });
      const primeraLinea = stdout.split('\n')[0] || '';
      const versionMatch = primeraLinea.match(/tesseract\s+v?([0-9a-zA-Z.-]+)/i);
      const version = versionMatch ? versionMatch[1]! : 'desconocida';
      return {
        nombre: 'tesseract',
        version,
        idioma: 'spa',
        disponible: true
      };
    } catch {
      return {
        nombre: 'tesseract',
        version: '',
        idioma: 'spa',
        disponible: false,
        detalle: 'Tesseract OCR no está disponible en PATH. Se documenta el bloqueo: no se descarga ni instala software con privilegios elevados. El adaptador y pipeline quedan listos para activarse cuando el binario esté disponible en PATH.'
      };
    }
  }

  async reconocer(png: Buffer, opts: { idioma?: string } = {}): Promise<string> {
    const info = await this.inspeccionar();
    if (!info.disponible) {
      throw new Error(`Motor OCR no disponible: ${info.detalle}`);
    }
    const idioma = opts.idioma ?? 'spa';
    return new Promise<string>((resolve, reject) => {
      const proc = spawn(this.binario, ['stdin', 'stdout', '-l', idioma], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      let out = '';
      let err = '';
      proc.stdout.on('data', (d: Buffer) => { out += d.toString('utf8'); });
      proc.stderr.on('data', (d: Buffer) => { err += d.toString('utf8'); });
      proc.on('close', (code: number) => {
        if (code === 0) resolve(out.trim());
        else reject(new Error(`Tesseract falló con código ${code}: ${err}`));
      });
      proc.on('error', reject);
      proc.stdin.end(png);
    });
  }
}

export interface ResultadoEvaluacionOcr {
  diarioId: string;
  pdfSha256: string;
  totalPaginasPdf: number;
  paginasSinCapaDeTexto: number[];
  motor: InfoMotorOcr;
  bloqueado: boolean;
  motivoBloqueo?: string;
  archivoOcr?: ArchivoOcr;
  rutaGuardada?: string;
}

/**
 * Evalúa OCR local sobre las páginas sin capa de texto de un diario.
 * Si el motor no está disponible (ej. tesseract ausente en PATH), documenta el bloqueo sin inventar texto.
 */
export async function evaluarOcrDiario(
  diario: { id: string; paginas: number; pdf: string; sha256?: string },
  paginasSinTexto: number[],
  adaptador: AdaptadorOcr,
  obtenerPngPagina?: (pagina: number) => Promise<{ png: Buffer; ancho: number; alto: number } | null>,
  opts: { guardar?: boolean; carpeta?: string } = {}
): Promise<ResultadoEvaluacionOcr> {
  const infoMotor = await adaptador.inspeccionar();
  const pdfSha = diario.sha256 && /^[0-9a-f]{64}$/.test(diario.sha256) ? diario.sha256 : '0'.repeat(64);

  if (!infoMotor.disponible) {
    return {
      diarioId: diario.id,
      pdfSha256: pdfSha,
      totalPaginasPdf: diario.paginas,
      paginasSinCapaDeTexto: paginasSinTexto,
      motor: infoMotor,
      bloqueado: true,
      motivoBloqueo: infoMotor.detalle
    };
  }

  if (!obtenerPngPagina) {
    throw new Error('Se requiere obtenerPngPagina para procesar páginas con el motor disponible');
  }

  const paginas: Record<string, PaginaOcr> = {};
  for (const n of paginasSinTexto) {
    const im = await obtenerPngPagina(n);
    if (!im) continue;
    const txt = await adaptador.reconocer(im.png, { idioma: infoMotor.idioma });
    const imgSha = crypto.createHash('sha256').update(im.png).digest('hex');
    paginas[String(n)] = {
      texto: txt,
      imagen: {
        ancho: im.ancho,
        alto: im.alto,
        sha256: imgSha
      }
    };
  }

  const archivoOcr: ArchivoOcr = {
    origen: ORIGEN_OCR,
    etiqueta: ETIQUETA_OCR,
    diarioId: diario.id,
    pdfSha256: pdfSha,
    motor: {
      nombre: infoMotor.nombre,
      version: infoMotor.version,
      idioma: infoMotor.idioma
    },
    generado: new Date().toISOString(),
    paginas
  };

  const errores = validarArchivoOcr(archivoOcr, {
    paginasSinTexto,
    totalPaginas: diario.paginas,
    pdfSha256: pdfSha,
    diarioId: diario.id
  });
  if (errores.length > 0) {
    throw new Error(`Archivo OCR generado no pasa validación: ${errores.join(', ')}`);
  }

  let rutaGuardada: string | undefined;
  if (opts.guardar) {
    rutaGuardada = guardarOcr(archivoOcr, opts.carpeta);
  }

  return {
    diarioId: diario.id,
    pdfSha256: pdfSha,
    totalPaginasPdf: diario.paginas,
    paginasSinCapaDeTexto: paginasSinTexto,
    motor: infoMotor,
    bloqueado: false,
    archivoOcr,
    rutaGuardada
  };
}
