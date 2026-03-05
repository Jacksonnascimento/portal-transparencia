import api from './api';

export interface SicSolicitacaoRequestDTO {
  nome: string;
  email: string;
  documento: string; // CPF ou CNPJ
  assunto: string;
  descricao: string;
  anonimo: boolean;
}

export interface SicSolicitacaoResponseDTO {
  protocolo: string;
  nome: string;
  documento: string;
  assunto: string;
  descricao: string;
  status: string; // Ex: 'ABERTO', 'EM_ANALISE', 'RESPONDIDO'
  dataCriacao: string;
  resposta?: string;
  dataResposta?: string;
}

export interface SicEstatisticasDTO {
  totalSolicitacoes: number;
  atendidas: number;
  emAndamento: number;
  tempoMedioRespostaDias: number;
}

export const sicService = {
  criarSolicitacao: async (dados: SicSolicitacaoRequestDTO): Promise<SicSolicitacaoResponseDTO> => {
    const response = await api.post('/portal/sic/solicitacoes', dados);
    return response.data;
  },
  
  consultarProtocolo: async (protocolo: string, documento: string): Promise<SicSolicitacaoResponseDTO> => {
    // Passando o documento via Query Params (?documento=...) conforme o @RequestParam do backend
    const response = await api.get(`/portal/sic/solicitacoes/${protocolo}`, { 
      params: { documento } 
    });
    return response.data;
  },

  obterEstatisticas: async (): Promise<SicEstatisticasDTO> => {
    const response = await api.get('/portal/sic/solicitacoes/estatisticas');
    return response.data;
  }
};