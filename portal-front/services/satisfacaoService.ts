import api from './api';

export interface PesquisaSatisfacaoRequestDTO {
  nota: number; // Ex: 1 a 5
  comentario?: string;
  // O back-end exige a chave 'moduloAvaliado' baseada no Enum ModuloAvaliado. Removido 'ESIC'.
  moduloAvaliado: 'PORTAL' | 'SIC'; 
}

export const satisfacaoService = {
  registrarAvaliacao: async (dados: PesquisaSatisfacaoRequestDTO): Promise<{ mensagem: string }> => {
    const response = await api.post('/portal/satisfacao', dados);
    return response.data;
  }
};