export type CategoryType = 
  | 'EDICTO_JUDICIAL'
  | 'REGISTRO_MARCA'
  | 'DECRETO_LEGISLATIVO'
  | 'ACUERDO_EJECUTIVO'
  | 'SUBASTA_EMBARGO'
  | 'BALANCE_FINANCIERO'
  | 'GENERAL';

export type LegalClassification =
  | 'Aceptación de Herencia'
  | 'Edicto Judicial'
  | 'Declaratoria de Rebeldía'
  | 'Título Supletorio'
  | 'Subasta Pública'
  | 'Aviso de Sociedad'
  | 'Decreto/Acuerdo';

export interface DiarioRecord {
  id: string;
  tomo: number;
  numero: number;
  fecha: string; // YYYY-MM-DD
  pagina: number;
  /** Última página en la que continúa la publicación (si ocupa más de una). */
  paginaFin?: number;
  /** Identificador del diario (fecha ISO). */
  diarioId?: string;
  /** Primera, segunda o tercera publicación (solo edictos). */
  publicacion?: string;
  /** Rangos exactos [página, desde, hasta) del texto de la página (orden de lectura) que ocupa la publicación. */
  rangos?: Array<[number, number, number]>;
  categoria: CategoryType;
  clasificacionJuridica?: LegalClassification;
  seccion: string;
  titular: string;
  contenido: string;
  /** Sumario o extracto explícito de la publicación (opcional). Solo se muestra como dato hallado si es lo que coincide. */
  sumario?: string;
  duisEncontrados: string[];
  nitsEncontrados: string[];
  nombresClave: string[];
  pdfUrlOficial: string;
  pdfUrlLocal?: string;
}

export interface AlertaSuscripcion {
  id: string;
  usuarioEmail: string;
  telefonoWhatsapp?: string;
  criterioBusqueda: string; // DUI, Nombre o Marca
  tipoCriterio: 'DUI' | 'NOMBRE' | 'MARCA' | 'EMPRESA';
  activa: boolean;
  fechaCreacion: string;
}

export interface SearchResult {
  total: number;
  results: Array<{
    diario: DiarioRecord;
    snippet: string;
    coincidenciaExacta: boolean;
  }>;
}
