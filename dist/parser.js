export function extractDuis(text) {
    const matches = text.match(/\b\d{8}-\d\b/g) || [];
    return Array.from(new Set(matches));
}
export function extractNits(text) {
    const matches = text.match(/\b\d{4}-\d{6}-\d{3}-\d\b/g) || [];
    return Array.from(new Set(matches));
}
export function detectCategory(text) {
    const lower = text.toLowerCase();
    if (lower.includes('edicto') || lower.includes('rebeldía') || lower.includes('tribunal') || lower.includes('juzgado') || lower.includes('emplazamiento')) {
        return 'EDICTO_JUDICIAL';
    }
    if (lower.includes('marca') || lower.includes('nombre comercial') || lower.includes('distintivo') || lower.includes('clase internacional')) {
        return 'REGISTRO_MARCA';
    }
    if (lower.includes('decreto no') || lower.includes('asamblea legislativa')) {
        return 'DECRETO_LEGISLATIVO';
    }
    if (lower.includes('acuerdo no') || lower.includes('ramo de')) {
        return 'ACUERDO_EJECUTIVO';
    }
    if (lower.includes('subasta') || lower.includes('embargo') || lower.includes('remate público')) {
        return 'SUBASTA_EMBARGO';
    }
    if (lower.includes('balance') || lower.includes('estado de resultados') || lower.includes('auditoría')) {
        return 'BALANCE_FINANCIERO';
    }
    return 'GENERAL';
}
export function parseRawEntry(rawText, meta) {
    const cleaned = rawText.replace(/\s+/g, ' ').trim();
    const duis = extractDuis(cleaned);
    const nits = extractNits(cleaned);
    const categoria = detectCategory(cleaned);
    // Extraer primer línea o frase como titular
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    const titular = lines[0]?.slice(0, 120) || `Publicación Oficial Pag. ${meta.pagina}`;
    return {
        id: `do-${meta.tomo}-${meta.numero}-p${meta.pagina}-${Math.random().toString(36).slice(2, 7)}`,
        tomo: meta.tomo,
        numero: meta.numero,
        fecha: meta.fecha,
        pagina: meta.pagina,
        categoria,
        seccion: categoria === 'EDICTO_JUDICIAL' ? 'Órgano Judicial / Edictos' : 'Sección General',
        titular,
        contenido: cleaned,
        duisEncontrados: duis,
        nitsEncontrados: nits,
        nombresClave: [],
        pdfUrlOficial: meta.pdfUrl
    };
}
