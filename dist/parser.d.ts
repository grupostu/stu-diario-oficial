import type { CategoryType, DiarioRecord } from './types.js';
export declare function extractDuis(text: string): string[];
export declare function extractNits(text: string): string[];
export declare function detectCategory(text: string): CategoryType;
export declare function parseRawEntry(rawText: string, meta: {
    tomo: number;
    numero: number;
    fecha: string;
    pagina: number;
    pdfUrl: string;
}): DiarioRecord;
