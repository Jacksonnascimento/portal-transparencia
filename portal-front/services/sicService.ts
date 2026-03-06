import api from './api';

// Interface para os trâmites da Linha do Tempo (Timeline)
export interface SicTramiteDTO {
  id?: number;
  status: string;
  observacao?: string;
  descricao?: string; 
  dataTramite: string;
}

// Interface para as Avaliações de Satisfação Recentes (Estrelinhas)
export interface SicFeedbackDTO {
  nota: number;
  comentario: string;
  dataAvaliacao: string;
}

// DTOs perfeitamente alinhados com o Backend Java
export interface SicSolicitacaoRequestDTO {
  nome: string;
  documento: string;
  email: string;
  tipoSolicitacao: string; // Ex: INFORMACAO, DENUNCIA, etc (Baseado no Enum SicTipo)
  mensagem: string;
  sigilo: boolean;
  urlAnexoSolicitacao?: string; // Suporta múltiplos links separados por vírgula
}

export interface SicSolicitacaoResponseDTO {
  protocolo: string;
  status: string; // Ex: RECEBIDO, EM_ANALISE, RESPONDIDO
  dataSolicitacao: string;
  respostaOficial?: string;
  urlAnexoResposta?: string;
  dataResposta?: string;
  justificativaProrrogacao?: string;
  tramites?: SicTramiteDTO[]; // Array injetado para desenhar o histórico visual
}

export interface SicEstatisticasDTO {
  totalPedidos: number;
  pedidosEmAberto: number;
  pedidosRespondidos: number;
  pedidosNegados?: number;
  pedidosEmAlerta?: number;
  pedidosExpirados?: number;
  tempoMedioRespostaDias: number;
  notaMedia?: number;
  totalAvaliacoes?: number;
  percentualAprovacao?: number;
  ultimosFeedbacks?: SicFeedbackDTO[]; // Lista com os últimos comentários do cidadão
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