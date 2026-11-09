// Dependencias que reciben las rutas (inyectadas por la aplicación): almacenes, catálogo y límites de uso.
import type { AlmacenOcr, AlmacenPublicaciones, AlmacenSuscripciones } from './almacen.js';
import type { Diario } from './diarios.js';
import type { LimitadorTasa } from './limitador.js';
import type { PortadaCache } from './portada_cache.js';

export interface ContextoRutas {
  publicaciones: AlmacenPublicaciones;
  suscripciones: AlmacenSuscripciones;
  ocr: AlmacenOcr;
  catalogo: Diario[];
  portada: PortadaCache;
  limites: {
    busqueda: LimitadorTasa;
    alertas: LimitadorTasa;
    lecturas: LimitadorTasa;
  };
  /** Tope de suscripciones en memoria. */
  maxSuscripciones: number;
}

export const TIPO_HTML = 'text/html; charset=utf-8';
export const TIPO_JSON = 'application/json; charset=utf-8';

/** Cabeceras de caché de borde (CDN) para páginas HTML públicas. */
export const CABECERAS_BORDE_HTML = {
  'Content-Type': TIPO_HTML,
  'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
  'CDN-Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  'Cloudflare-CDN-Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
};

/** Cabeceras de caché de borde (CDN) para respuestas JSON de consulta. */
export const CABECERAS_BORDE_API = {
  'Cache-Control': 'public, max-age=120, s-maxage=600, stale-while-revalidate=3600',
  'CDN-Cache-Control': 'public, max-age=600, stale-while-revalidate=3600'
};

export const SIN_CACHE = { 'Cache-Control': 'no-cache' };
