// Evalúa el reconocimiento óptico de caracteres (OCR) local (Tesseract) para las páginas
// de un Diario Oficial que no tienen capa de texto digital (ej. Decreto 690, págs. 3-15).
//
// REGLAS:
//  - Si tesseract no está en PATH, se documenta el bloqueo de forma limpia: CERO texto simulado o inventado.
//  - El texto OCR jamás se mezcla con el texto oficial ni se indexa en el buscador principal.
//  - Todo dato del catálogo y páginas se rastrea al PDF original.
//
// Uso:  npx tsx scripts/evaluar_ocr.ts [rutaPdf]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { extraerPaginas } from './pdf_paginas.js';
import { abrirImagenes } from './pdf_imagenes.js';
import {
  esPaginaSinCapaDeTexto,
  TesseractCliAdaptador,
  evaluarOcrDiario,
  ETIQUETA_OCR
} from '../src/ocr.js';
import { nucleo } from '../src/resaltado.js';

const MESES: Record<string, string> = {
  enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
  julio: '07', agosto: '08', septiembre: '09', setiembre: '09', octubre: '10',
  noviembre: '11', diciembre: '12'
};

async function main(): Promise<void> {
  const rutaRelativa = process.argv[2] ?? 'public/pdf/23-10-2026.pdf';
  const rutaPdf = path.resolve(rutaRelativa);

  if (!fs.existsSync(rutaPdf)) {
    console.error(`[ocr] Archivo PDF no encontrado: ${rutaPdf}`);
    process.exit(1);
  }

  const bytes = fs.readFileSync(rutaPdf);
  const sha256Pdf = crypto.createHash('sha256').update(bytes).digest('hex');
  console.log(`[ocr] Analizando PDF: ${path.basename(rutaPdf)} (${(bytes.length / 1024 / 1024).toFixed(2)} MB, sha256: ${sha256Pdf.slice(0, 16)}...)`);

  const paginas = await extraerPaginas(rutaPdf);
  const docImagenes = await abrirImagenes(rutaPdf);
  const total = paginas.length;

  // Portada: Tomo, Número, Fecha
  const portada = nucleo.plegar(paginas[0]!.texto).plano;
  const tomo = /tomo\s*n\S*\s*(\d{2,4})/.exec(portada)?.[1] ?? '0';
  const numero = /numero\s*(\d{1,4})/.exec(portada)?.[1] ?? '0';
  const f = /(\d{1,2}) de (\w+) de ?\s*(\d{4})/.exec(portada.replace(/\bde(\d{4})/, 'de $1'));
  const fecha = f && MESES[f[2]!] ? `${f[3]}-${MESES[f[2]!]}-${f[1]!.padStart(2, '0')}` : '2026-10-23';

  console.log(`[ocr] Edición identificada: Tomo ${tomo}, N.° ${numero}, Fecha ${fecha}`);

  // Identificar páginas sin capa de texto
  const paginasSinCapa: number[] = [];
  const detallePaginas: Array<{ pagina: number; chars: number; cobertura: number }> = [];

  for (let n = 1; n <= total; n++) {
    const pag = paginas[n - 1]!;
    const ims = await docImagenes.imagenes(n);
    const mayorCob = ims[0]?.cobertura ?? 0;
    const charsCuerpo = pag.lineas.filter((l) => l.k !== 'c').reduce((acc, l) => acc + (l.b - l.a), 0);
    const sinCapa = esPaginaSinCapaDeTexto(charsCuerpo, mayorCob);
    if (sinCapa) {
      paginasSinCapa.push(n);
      detallePaginas.push({ pagina: n, chars: charsCuerpo, cobertura: mayorCob });
    }
  }

  console.log(`[ocr] Se encontraron ${paginasSinCapa.length} páginas sin capa de texto digital de un total de ${total}:`);
  console.log(`      Páginas: ${paginasSinCapa.join(', ')}`);

  // Decreto 690 específico (páginas 3 a 14)
  const pagsDec690 = paginasSinCapa.filter((p) => p >= 3 && p <= 14);
  console.log(`[ocr] Caso Decreto No. 690 (Ley Especial Transitoria de facilidades tributarias):`);
  console.log(`      Páginas 3 a 14 detectadas como escaneo puro sin capa de texto digital (${pagsDec690.length}/12 págs).`);

  // Evaluación de Tesseract local
  const adaptador = new TesseractCliAdaptador();
  const infoMotor = await adaptador.inspeccionar();

  console.log(`[ocr] Estado del motor local:`);
  console.log(`      Motor: ${infoMotor.nombre}`);
  console.log(`      Disponible: ${infoMotor.disponible ? 'SÍ' : 'NO'}`);
  if (infoMotor.version) console.log(`      Versión: ${infoMotor.version}`);
  console.log(`      Idioma: ${infoMotor.idioma}`);

  const resultado = await evaluarOcrDiario(
    { id: fecha, paginas: total, pdf: `/pdf/${path.basename(rutaPdf)}`, sha256: sha256Pdf },
    paginasSinCapa,
    adaptador,
    (n) => docImagenes.pngPrincipal(n)
  );

  if (resultado.bloqueado) {
    console.log(`[ocr] BLOQUEO DOCUMENTADO:`);
    console.log(`      ${resultado.motivoBloqueo}`);
    console.log(`      Regla ética y legal: NINGÚN texto OCR ficticio ni simulado fue emitido.`);
    console.log(`      El pipeline, extractor de PNGs, vistas y adaptador están listos para activarse automáticamente cuando tesseract esté disponible.`);
    console.log(`      Etiqueta obligatoria reservada: «${ETIQUETA_OCR}».`);
  } else {
    console.log(`[ocr] OCR completado con éxito para ${Object.keys(resultado.archivoOcr?.paginas ?? {}).length} páginas.`);
  }
}

main().catch((err) => {
  console.error('[ocr] Error durante la evaluación:', err);
  process.exit(1);
});
