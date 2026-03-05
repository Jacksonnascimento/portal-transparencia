import api from './api';

export interface PesquisaSatisfacaoRequestDTO {
  nota: number; // Ex: 1 a 5
  comentario?: string;
  // O back-end exige a chave 'moduloAvaliado' baseada no Enum ModuloAvaliado (PORTAL, ESIC)
  moduloAvaliado: 'PORTAL' | 'ESIC'; 
}

export const satisfacaoService = {
  registrarAvaliacao: async (dados: PesquisaSatisfacaoRequestDTO): Promise<{ mensagem: string }> => {
    const response = await api.post('/portal/satisfacao', dados);
    return response.data;
  }
};