import api from './api';

// Enums baseados na sua API Java
export enum TipoRelatorio {
  RREO = 'RREO',
  RGF = 'RGF',
  BALANCO_ANUAL = 'BALANCO_ANUAL',
  PRESTACAO_CONTAS_ANUAL = 'PRESTACAO_CONTAS_ANUAL',
  OUTROS = 'OUTROS'
}

export enum TipoPeriodo {
  MENSAL = 'MENSAL',
  BIMESTRAL = 'BIMESTRAL',
  TRIMESTRAL = 'TRIMESTRAL',
  QUADRIMESTRAL = 'QUADRIMESTRAL',
  SEMESTRAL = 'SEMESTRAL',
  ANUAL = 'ANUAL'
}

// DTO espelhado do backend
export interface PrestacaoContasResponseDTO {
  id: string;
  tipoRelatorio: TipoRelatorio;
  exercicio: number;
  periodo: number;
  tipoPeriodo: TipoPeriodo;
  dataPublicacao: string;
  arquivoPdfUrl: string;
  arquivoNome: string;
}

// Interface padrão de paginação do Spring
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface FiltrosPrestacaoContas {
  tipoRelatorio?: string;
  exercicio?: number;
  page?: number;
  size?: number;
}

export const obterPrestacaoContas = async (
  filtros: FiltrosPrestacaoContas
): Promise<Page<PrestacaoContasResponseDTO>> => {
  // Ajuste a rota '/portal/prestacao-contas' conforme o mapeamento exato do seu controller
  const { data } = await api.get('/portal/prestacao-contas', { params: filtros });
  return data;
};