// Escape de HTML en servidor: única copia para vistas, páginas base y vista OCR.
const ENTIDADES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa & < > " ' de cualquier valor (se convierte antes a texto). */
export function escapeHtml(valor: unknown): string {
  return String(valor).replace(/[&<>"']/g, (c) => ENTIDADES[c] as string);
}
