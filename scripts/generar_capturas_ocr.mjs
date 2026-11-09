import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Dev/CrediFlow_ERP/node_modules/playwright');

// Importar renderVistaOcr desde dist
const { renderVistaOcr, ETIQUETA_OCR } = await import('../dist/ocr.js');

const html = renderVistaOcr({
  diarioId: '2026-10-23',
  tomo: 453,
  numero: 198,
  fecha: '2026-10-23',
  pagina: 3,
  pdf: '/pdf/23-10-2026.pdf',
  sinCapaDeTexto: true,
  ocr: null
});

const outDir = 'C:/Dev/REPORTES_8H_IAS';
const viewports = [
  { name: '1920', width: 1920, height: 1080 },
  { name: '1280', width: 1280, height: 800 },
  { name: '375', width: 375, height: 812 }
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.setContent(html, { waitUntil: 'load' });
    const ruta = path.join(outDir, `DiarioOficial_ocr_${vp.name}.png`);
    await page.screenshot({ path: ruta, fullPage: true });
    console.log(`[captura] Generada: ${ruta}`);
    await page.close();
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
