import type { DiarioRecord, SearchResult } from './types.js';
export declare class DiarioIndex {
    private records;
    private duiIndex;
    addRecord(record: DiarioRecord): void;
    addBatch(records: DiarioRecord[]): void;
    search(query: string, categoryFilter?: string): SearchResult;
    private generateSnippet;
    count(): number;
}
