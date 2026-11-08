// Enlaces profundos al Visor Ebook: /visor?id=<id de publicación> -> folio del PDF oficial.
import type { DiarioIndex } from './indexer.js';

const ID_VALIDO = /^[a-z0-9][a-z0-9-]{2,80}$/i;

/** Devuelve la URL local del folio PDF (solo rutas /pdf/...) o null si el id no existe o es inválido. */
export function resolverEnlaceVisor(index: DiarioIndex, id: unknown): string | null {
  if (typeof id !== 'string' || !ID_VALIDO.test(id)) return null;
  const rec = index.getById(id);
  const destino = rec?.pdfUrlLocal ?? rec?.pdfUrlOficial ?? '';
  return /^\/pdf\/[\w.-]+\.pdf#page=\d{1,5}$/.test(destino) ? destino : null;
}
