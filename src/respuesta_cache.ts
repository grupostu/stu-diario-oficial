// Respuestas precomprimidas (gzip/brotli) con ETag y caché TTL acotada.
// Objetivo: renderizar y comprimir UNA vez y servir miles de peticiones con CPU casi nula
// (el servicio es sin estado: cada réplica mantiene su propia copia en memoria).
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';

export interface Precomprimida {
  raw: Buffer;
  gz: Buffer | null;
  br: Buffer | null;
  etag: string;
  tipo: string;
}

const MIN_COMPRIMIR = 512;

/** Prepara cuerpo + variantes comprimidas. `calidadBr` 4-5 para contenido dinámico, 9-11 para el que se calcula al arrancar. */
export function precomprimir(cuerpo: string | Buffer, tipo: string, calidadBr = 5): Precomprimida {
  const raw = Buffer.isBuffer(cuerpo) ? cuerpo : Buffer.from(cuerpo, 'utf8');
  const etag = `"${createHash('sha1').update(raw).digest('base64url').slice(0, 27)}"`;
  if (raw.length < MIN_COMPRIMIR) return { raw, gz: null, br: null, etag, tipo };
  const gz = gzipSync(raw, { level: 6 });
  const br = brotliCompressSync(raw, { params: { [constants.BROTLI_PARAM_QUALITY]: calidadBr, [constants.BROTLI_PARAM_SIZE_HINT]: raw.length } });
  return { raw, gz, br, etag, tipo };
}

/** Envía una respuesta precomprimida negociando Accept-Encoding y respondiendo 304 si el ETag coincide. */
export function enviarPrecomprimida(req: Request, res: Response, p: Precomprimida, cabeceras?: Record<string, string>): void {
  if (cabeceras) res.set(cabeceras);
  res.setHeader('Content-Type', p.tipo);
  res.setHeader('ETag', p.etag);
  res.vary('Accept-Encoding');
  const inm = req.headers['if-none-match'];
  if (inm && inm.split(',').some((x) => x.trim().replace(/^W\//, '') === p.etag)) {
    res.status(304).end();
    return;
  }
  const acepta = String(req.headers['accept-encoding'] || '');
  let cuerpo = p.raw;
  if (p.br && /\bbr\b/.test(acepta)) {
    cuerpo = p.br;
    res.setHeader('Content-Encoding', 'br');
  } else if (p.gz && /\bgzip\b/.test(acepta)) {
    cuerpo = p.gz;
    res.setHeader('Content-Encoding', 'gzip');
  }
  res.setHeader('Content-Length', cuerpo.length);
  res.end(req.method === 'HEAD' ? undefined : cuerpo);
}

/** Caché con vencimiento y tope de entradas (descarta las más antiguas): memoria siempre acotada. */
export class CacheTTL<V> {
  private mapa = new Map<string, { hasta: number; v: V }>();
  constructor(private readonly max: number, private readonly ttlMs: number) {}
  get(k: string, ahora = Date.now()): V | undefined {
    const e = this.mapa.get(k);
    if (!e) return undefined;
    if (e.hasta <= ahora) {
      this.mapa.delete(k);
      return undefined;
    }
    return e.v;
  }
  set(k: string, v: V, ahora = Date.now()): V {
    if (this.mapa.size >= this.max && !this.mapa.has(k)) {
      const primera = this.mapa.keys().next().value;
      if (primera !== undefined) this.mapa.delete(primera);
    }
    this.mapa.set(k, { hasta: ahora + this.ttlMs, v });
    return v;
  }
  get tamano(): number {
    return this.mapa.size;
  }
}
