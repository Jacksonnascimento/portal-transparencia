import api from './api';

// DTOs perfeitamente alinhados com o Backend Java
export interface SicSolicitacaoRequestDTO {
  nome: string;
  documento: string;
  email: string;
  tipoSolicitacao: string; // Ex: INFORMACAO, DENUNCIA, etc (Baseado no Enum SicTipo)
  mensagem: string;
  sigilo: boolean;
  urlAnexoSolicitacao?: string;
}

export interface SicSolicitacaoResponseDTO {
  protocolo: string;
  status: string; // Ex: ABERTO, RESPONDIDO
  dataSolicitacao: string;
  respostaOficial?: string;
  urlAnexoResposta?: string;
  dataResposta?: string;
  justificativaProrrogacao?: string;
}

export interface SicEstatisticasDTO {
  totalSolicitacoes: number;
  abertas: number;
  respondidas: number;
  tempoMedioRespostaDias: number;
}

export const sicService = {
  criarSolicitacao: async (dados: SicSolicitacaoRequestDTO): Promise<SicSolicitacaoResponseDTO> => {
    const response = await api.post('/portal/sic/solicitacoes', dados);
    return response.data;
  },
  
  consultarProtocolo: async (protocolo: string, documento: string): Promise<SicSolicitacaoResponseDTO> => {
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