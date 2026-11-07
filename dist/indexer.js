export class DiarioIndex {
    records = [];
    duiIndex = new Map();
    addRecord(record) {
        this.records.push(record);
        for (const dui of record.duisEncontrados) {
            const clean = dui.replace('-', '');
            const existing = this.duiIndex.get(clean) || [];
            existing.push(record);
            this.duiIndex.set(clean, existing);
        }
    }
    addBatch(records) {
        for (const r of records) {
            this.addRecord(r);
        }
    }
    search(query, categoryFilter) {
        const q = query.trim().toLowerCase();
        if (!q) {
            return { total: 0, results: [] };
        }
        const qCleanDui = q.replace(/[^0-9]/g, '');
        const isDuiQuery = qCleanDui.length === 9;
        let matched = [];
        // 1. Coincidencia rápida por DUI si corresponde
        if (isDuiQuery && this.duiIndex.has(qCleanDui)) {
            const records = this.duiIndex.get(qCleanDui);
            for (const rec of records) {
                if (categoryFilter && rec.categoria !== categoryFilter)
                    continue;
                matched.push({
                    diario: rec,
                    snippet: this.generateSnippet(rec.contenido, q),
                    coincidenciaExacta: true
                });
            }
        }
        // 2. Búsqueda Full-Text por nombre, empresa o palabras clave
        for (const rec of this.records) {
            if (categoryFilter && rec.categoria !== categoryFilter)
                continue;
            // Evitar duplicados si ya entró por DUI
            if (matched.some((m) => m.diario.id === rec.id))
                continue;
            const lowerContent = rec.contenido.toLowerCase();
            if (lowerContent.includes(q)) {
                matched.push({
                    diario: rec,
                    snippet: this.generateSnippet(rec.contenido, q),
                    coincidenciaExacta: false
                });
            }
        }
        return {
            total: matched.length,
            results: matched
        };
    }
    generateSnippet(content, query) {
        const lower = content.toLowerCase();
        const idx = lower.indexOf(query.toLowerCase());
        if (idx === -1) {
            return content.slice(0, 240) + '...';
        }
        const start = Math.max(0, idx - 80);
        const end = Math.min(content.length, idx + query.length + 120);
        const slice = content.slice(start, end);
        const regex = new RegExp(`(${query})`, 'gi');
        return (start > 0 ? '...' : '') + slice.replace(regex, '<mark class="bg-amber-400 text-slate-950 font-bold px-1 rounded">$1</mark>') + (end < content.length ? '...' : '');
    }
    count() {
        return this.records.length;
    }
}
