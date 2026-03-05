import api from './api';

export interface PesquisaSatisfacaoRequestDTO {
  nota: number; // Ex: 1 a 5 ou 1 a 3
  comentario?: string;
  urlPagina: string; // Para o backend saber qual página foi avaliada
}

export const satisfacaoService = {
  registrarAvaliacao: async (dados: PesquisaSatisfacaoRequestDTO): Promise<{ mensagem: string }> => {
    const response = await api.post('/portal/satisfacao', dados);
    return response.data;
  }
};