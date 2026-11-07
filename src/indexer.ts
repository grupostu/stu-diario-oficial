import type { CategoryType, DiarioRecord, SearchResult } from './types.js';
import { normalizeDuiInput } from './parser.js';

export class DiarioIndex {
  private records: DiarioRecord[] = [];
  private duiIndex: Map<string, DiarioRecord[]> = new Map();
  private categoryIndex: Map<CategoryType, DiarioRecord[]> = new Map();

  addRecord(record: DiarioRecord): void {
    this.records.push(record);

    // Index by category
    const catList = this.categoryIndex.get(record.categoria) || [];
    catList.push(record);
    this.categoryIndex.set(record.categoria, catList);

    // Index by each DUI found (both canonical 00000000-0 and raw digits 000000000)
    for (const dui of record.duisEncontrados) {
      const cleanDigits = dui.replace(/\D/g, '');
      const canonical = dui.includes('-') ? dui : `${cleanDigits.slice(0, 8)}-${cleanDigits.slice(8)}`;

      // Map clean digits
      const listDigits = this.duiIndex.get(cleanDigits) || [];
      if (!listDigits.some(r => r.id === record.id)) {
        listDigits.push(record);
      }
      this.duiIndex.set(cleanDigits, listDigits);

      // Map canonical
      const listCanonical = this.duiIndex.get(canonical) || [];
      if (!listCanonical.some(r => r.id === record.id)) {
        listCanonical.push(record);
      }
      this.duiIndex.set(canonical, listCanonical);
    }
  }

  addBatch(records: DiarioRecord[]): void {
    for (const r of records) {
      this.addRecord(r);
    }
  }

  search(query: string, categoryFilter?: string, forceDuiOnly?: boolean): SearchResult & { duiNormalized?: string } {
    const q = query.trim();
    if (!q) {
      return { total: 0, results: [] };
    }

    const duiInfo = normalizeDuiInput(q);
    let matched: Array<{ diario: DiarioRecord; snippet: string; coincidenciaExacta: boolean }> = [];

    // 1. Si es búsqueda de DUI o el usuario forzó búsqueda por DUI
    if (duiInfo.isValidDui) {
      const fromCanonical = this.duiIndex.get(duiInfo.canonical) || [];
      const fromDigits = this.duiIndex.get(duiInfo.cleanDigits) || [];
      const combinedDuiRecords = Array.from(new Set([...fromCanonical, ...fromDigits]));

      for (const rec of combinedDuiRecords) {
        if (categoryFilter && rec.categoria !== categoryFilter) continue;
        matched.push({
          diario: rec,
          snippet: this.generateSnippet(rec.contenido, duiInfo.canonical),
          coincidenciaExacta: true
        });
      }
    }

    // Si el usuario marcó explícitamente "Solo DUI" y encontramos coincidencias o es un DUI válido, retornar
    if (forceDuiOnly && duiInfo.isValidDui) {
      return {
        total: matched.length,
        results: matched,
        duiNormalized: duiInfo.canonical
      };
    }

    // 2. Búsqueda Full-Text por nombre de persona, empresa, marca, tribunal o palabras clave
    const lowerQuery = q.toLowerCase();
    for (const rec of this.records) {
      if (categoryFilter && rec.categoria !== categoryFilter) continue;
      if (matched.some((m) => m.diario.id === rec.id)) continue;

      const lowerContent = rec.contenido.toLowerCase();
      const lowerTitular = rec.titular.toLowerCase();

      if (lowerContent.includes(lowerQuery) || lowerTitular.includes(lowerQuery)) {
        matched.push({
          diario: rec,
          snippet: this.generateSnippet(rec.contenido, q),
          coincidenciaExacta: false
        });
      }
    }

    return {
      total: matched.length,
      results: matched,
      duiNormalized: duiInfo.isValidDui ? duiInfo.canonical : undefined
    };
  }

  getRecentByCategory(category: CategoryType, limit = 10): DiarioRecord[] {
    const list = this.categoryIndex.get(category) || [];
    return list.slice(0, limit);
  }

  getAllRecords(): DiarioRecord[] {
    return this.records;
  }

  private generateSnippet(content: string, term: string): string {
    const lower = content.toLowerCase();
    const cleanDigits = term.replace(/\D/g, '');
    
    let idx = lower.indexOf(term.toLowerCase());
    let matchLen = term.length;

    // Si no está el término exacto pero es DUI, buscar los dígitos o palabras
    if (idx === -1 && cleanDigits.length === 9) {
      idx = lower.indexOf(cleanDigits);
      if (idx !== -1) {
        matchLen = cleanDigits.length;
      } else {
        // Buscar palabras como "cero cero tres"
        const firstFew = cleanDigits.slice(0, 4);
        idx = lower.indexOf("documento");
        if (idx === -1) idx = lower.indexOf("identidad");
        if (idx === -1) idx = 0;
        matchLen = 15;
      }
    }

    if (idx === -1) {
      idx = 0;
    }

    const start = Math.max(0, idx - 100);
    const end = Math.min(content.length, idx + matchLen + 150);
    const slice = content.slice(start, end);
    const regex = new RegExp(`(${term}|${cleanDigits})`, 'gi');
    return (start > 0 ? '...' : '') + slice.replace(regex, '<mark class="bg-amber-400 text-slate-950 font-bold px-1 rounded">$1</mark>') + (end < content.length ? '...' : '');
  }

  count(): number {
    return this.records.length;
  }
}
