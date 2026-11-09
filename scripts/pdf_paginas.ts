// Extrae el modelo de lectura de TODAS las páginas de un PDF con el mismo pdf.js que usa el visor.
import { createRequire } from 'module';
import fs from 'fs';
import { lectura, type ModeloPagina } from '../src/lectura.js';

const require = createRequire(import.meta.url);

export interface PaginaExtraida extends ModeloPagina {
  pagina: number;
  ancho: number;
  alto: number;
}

export async function extraerPaginas(rutaPdf: string): Promise<PaginaExtraida[]> {
  const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
  const data = new Uint8Array(fs.readFileSync(rutaPdf));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true, verbosity: 0 }).promise;
  const out: PaginaExtraida[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const p = await doc.getPage(n);
    const vp = p.getViewport({ scale: 1 });
    const tc = await p.getTextContent();
    const m = lectura.modeloPagina(tc.items, vp.width, vp.height);
    out.push({ pagina: n, ancho: vp.width, alto: vp.height, ...m });
    p.cleanup();
  }
  return out;
}
