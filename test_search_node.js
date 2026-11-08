import { DiarioIndex } from './src/indexer.js';
import fs from 'fs';

const idx = new DiarioIndex();
const data = JSON.parse(fs.readFileSync('./src/data_diario_real.json', 'utf-8'));
idx.addBatch(data);

console.log("Total records added:", idx.count());

// Test search 1: with digits
const res1 = idx.search("003562742");
console.log("Search '003562742':", res1.total, "results. DuiNormalized:", res1.duiNormalized);
if (res1.results.length > 0) {
  console.log("  Titular:", res1.results[0].diario.titular);
  console.log("  Page:", res1.results[0].diario.pagina);
}

// Test search 2: with canonical format
const res2 = idx.search("00356274-2");
console.log("Search '00356274-2':", res2.total, "results.");

// Test search 3: with words
const res3 = idx.search("cero cero tres cinco seis dos siete cuatro dos");
console.log("Search in words:", res3.total, "results. DuiNormalized:", res3.duiNormalized);

// Test search 4: with missing zero
const res4 = idx.search("356274-2");
console.log("Search '356274-2':", res4.total, "results. DuiNormalized:", res4.duiNormalized);
