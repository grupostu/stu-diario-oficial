// Activos estáticos de la portada (CSS y JS que antes iban en línea): se sirven como archivos con huella en el nombre,
// caché inmutable de un año y ETag. Así el HTML de la portada pesa una fracción y el navegador/CDN reutiliza los activos.
import { createHash } from 'node:crypto';
import { PORTADA_CSS } from './portada_css.js';
import { PORTADA_JS } from './portada_js.js';
import { precomprimir, type Precomprimida } from './respuesta_cache.js';

export interface ActivoPortada {
  /** Nombre de archivo con huella de contenido (cambia solo si cambia el contenido). */
  nombre: string;
  url: string;
  contenido: string;
  tipo: string;
}

function definir(base: string, ext: 'css' | 'js', contenido: string, tipo: string): ActivoPortada {
  const huella = createHash('sha256').update(contenido).digest('hex').slice(0, 12);
  const nombre = `${base}.${huella}.${ext}`;
  return { nombre, url: `/estatico/${nombre}`, contenido, tipo };
}

export const ACTIVO_CSS = definir('portada', 'css', PORTADA_CSS, 'text/css; charset=utf-8');
export const ACTIVO_JS = definir('portada', 'js', PORTADA_JS, 'text/javascript; charset=utf-8');

/** Cabeceras de caché de un activo con huella: inmutable durante un año. */
export const CABECERAS_ACTIVO_INMUTABLE = { 'Cache-Control': 'public, max-age=31536000, immutable' };

const precomprimidos = new Map<string, Precomprimida>();

/** Activo precomprimido (gzip/br) listo para servir, o undefined si el nombre no es de un activo conocido. */
export function activoPrecomprimido(nombre: string): Precomprimida | undefined {
  const activo = [ACTIVO_CSS, ACTIVO_JS].find((a) => a.nombre === nombre);
  if (!activo) return undefined;
  let pre = precomprimidos.get(nombre);
  if (!pre) {
    pre = precomprimir(activo.contenido, activo.tipo, 9);
    precomprimidos.set(nombre, pre);
  }
  return pre;
}
