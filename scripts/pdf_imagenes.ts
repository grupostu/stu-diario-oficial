// Imágenes incrustadas de las páginas de un PDF (escaneos). Sirve para dos cosas:
//  1) detectar páginas sin capa de texto (la página es una imagen y solo tiene cabecera y pie digitales);
//  2) entregar esa imagen, tal cual viene en el PDF, a un motor de OCR local.
// No dibuja la página: no depende de canvas ni de binarios externos.
import { createRequire } from 'module';
import fs from 'fs';
import { codificarPng } from './png.js';

const require = createRequire(import.meta.url);

export interface ImagenPagina {
  /** Nombre interno del objeto en el PDF. */
  nombre: string;
  /** Tamaño en píxeles de la imagen incrustada. */
  ancho: number;
  alto: number;
  /** Fracción (0–1) del área de la página que cubre la imagen. */
  cobertura: number;
}

type Matriz = [number, number, number, number, number, number];
const multiplicar = (m: Matriz, n: Matriz): Matriz => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]
];

export interface DocumentoImagenes {
  numPaginas: number;
  /** Imágenes de una página con su cobertura, de mayor a menor. */
  imagenes(pagina: number): Promise<ImagenPagina[]>;
  /** PNG de la imagen más grande de la página, tal como está en el PDF; null si no hay imagen. */
  pngPrincipal(pagina: number): Promise<{ png: Buffer; ancho: number; alto: number } | null>;
}

export async function abrirImagenes(rutaPdf: string): Promise<DocumentoImagenes> {
  const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
  const OPS = pdfjs.OPS;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(rutaPdf)), useSystemFonts: true, verbosity: 0 }).promise;

  async function recorrer(n: number): Promise<{ lista: ImagenPagina[]; pagina: any }> {
    const pagina = await doc.getPage(n);
    const vp = pagina.getViewport({ scale: 1 });
    const ol = await pagina.getOperatorList();
    const lista: ImagenPagina[] = [];
    let ctm: Matriz = [1, 0, 0, 1, 0, 0];
    const pila: Matriz[] = [];
    for (let i = 0; i < ol.fnArray.length; i++) {
      const f = ol.fnArray[i];
      if (f === OPS.save) pila.push([...ctm] as Matriz);
      else if (f === OPS.restore) ctm = pila.pop() ?? ctm;
      else if (f === OPS.transform) ctm = multiplicar(ctm, ol.argsArray[i] as Matriz);
      else if (f === OPS.paintImageXObject) {
        const nombre = String(ol.argsArray[i][0]);
        // La imagen ocupa el cuadrado unidad transformado por la matriz vigente.
        const anchoPt = Math.hypot(ctm[0], ctm[1]);
        const altoPt = Math.hypot(ctm[2], ctm[3]);
        const img: any = await new Promise((res) => pagina.objs.get(nombre, res));
        lista.push({ nombre, ancho: img.width, alto: img.height, cobertura: Math.min(1, (anchoPt * altoPt) / (vp.width * vp.height)) });
      }
    }
    lista.sort((a, b) => b.cobertura - a.cobertura);
    return { lista, pagina };
  }

  return {
    numPaginas: doc.numPages,
    async imagenes(n) {
      const { lista, pagina } = await recorrer(n);
      pagina.cleanup();
      return lista;
    },
    async pngPrincipal(n) {
      const { lista, pagina } = await recorrer(n);
      try {
        const mayor = lista[0];
        if (!mayor) return null;
        const img: any = await new Promise((res) => pagina.objs.get(mayor.nombre, res));
        // kind de pdf.js: 1 = 1 bit por píxel (gris), 2 = RGB 24 bits, 3 = RGBA 32 bits.
        if (img.kind === 2) return { png: codificarPng(img.width, img.height, 2, img.data), ancho: img.width, alto: img.height };
        if (img.kind === 3) return { png: codificarPng(img.width, img.height, 6, img.data), ancho: img.width, alto: img.height };
        if (img.kind === 1) {
          // Desempaqueta el mapa de bits (1 bit por píxel, filas alineadas a byte; 1 = blanco) a gris de 8 bits.
          const bytesFila = Math.ceil(img.width / 8);
          const gris = new Uint8Array(img.width * img.height);
          for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
              gris[y * img.width + x] = (img.data[y * bytesFila + (x >> 3)]! >> (7 - (x & 7))) & 1 ? 255 : 0;
            }
          }
          return { png: codificarPng(img.width, img.height, 0, gris), ancho: img.width, alto: img.height };
        }
        return null;
      } finally {
        pagina.cleanup();
      }
    }
  };
}
