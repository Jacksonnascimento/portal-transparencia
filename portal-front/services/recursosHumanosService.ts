import api from './api'; // Importa a instância do axios que você forneceu

// Mapeamento exato do ServidorPublicoDTO.java
export interface ServidorPublicoDTO {
  id: number;
  nome: string;
  cpf: string; 
  matricula: string;
  cargo: string;
  lotacao: string;
  tipoVinculo: string;
  dataAdmissao: string;
  dataExoneracao?: string;
  cargaHoraria: number;
  empresaContratante?: string;
  cnpjContratante?: string;
}

// Mapeamento exato do FolhaPagamentoPublicoDTO.java
export interface FolhaPagamentoPublicoDTO {
  id: number;
  servidorId: number;
  nomeServidor: string;
  cargoServidor: string;
  exercicio: number;
  mes: number;
  remuneracaoBruta: number;
  verbasIndenizatorias: number;
  descontosLegais: number;
  salarioLiquido: number;
}

// Interface padrão de paginação do Spring Boot (Page<T>)
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const recursosHumanosService = {
  // Chamadas para Servidores
  listarServidores: async (params: { nome?: string; cargo?: string; lotacao?: string; page?: number; size?: number }) => {
    const { data } = await api.get<Page<ServidorPublicoDTO>>('/portal/servidores', { params });
    return data;
  },

  exportarServidoresCsv: async (params: { nome?: string; cargo?: string; lotacao?: string }) => {
    const response = await api.get('/portal/servidores/exportar/csv', { params, responseType: 'blob' });
    return response.data;
  },

  // Chamadas para Folha de Pagamento
  listarFolhaPagamento: async (params: { nomeServidor?: string; exercicio?: number; mes?: number; page?: number; size?: number }) => {
    const { data } = await api.get<Page<FolhaPagamentoPublicoDTO>>('/portal/folha-pagamento', { params });
    return data;
  },

  exportarFolhaCsv: async (params: { nomeServidor?: string; exercicio?: number; mes?: number }) => {
    const response = await api.get('/portal/folha-pagamento/exportar/csv', { params, responseType: 'blob' });
    return response.data;
  }
};