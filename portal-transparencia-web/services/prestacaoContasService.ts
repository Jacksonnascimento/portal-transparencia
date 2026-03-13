import api from './api';

// --- Interfaces de Tipagem ---

export interface PrestacaoContas {
  id: string;
  tipoRelatorio: 'RREO' | 'RGF' | 'BALANCO_GERAL';
  exercicio: number;
  periodo?: number;
  tipoPeriodo: 'BIMESTRE' | 'QUADRIMESTRE' | 'SEMESTRE' | 'ANUAL';
  dataPublicacao: string;
  arquivoPdfUrl: string;
  arquivoNome: string;
}

export interface PrestacaoContasRequest {
  tipoRelatorio: string;
  exercicio: number;
  periodo?: number;
  tipoPeriodo: string;
  dataPublicacao: string;
}

export interface FiltrosPrestacaoContas {
  tipoRelatorio?: string;
  exercicio?: number;
  periodo?: number;
  tipoPeriodo?: string;
  termoBusca?: string;
  page?: number;
  size?: number;
}

// --- Serviço de API ---

export const prestacaoContasService = {
  
  // Lista os relatórios com suporte a paginação e filtros opcionais
  async listar(filtros: FiltrosPrestacaoContas) {
    const response = await api.get('/prestacao-contas', { params: filtros });
    return response.data;
  },

  // Faz o upload do PDF em conjunto com os dados do formulário
  async salvar(dados: PrestacaoContasRequest, file: File) {
    const formData = new FormData();
    
    // 1. Anexa o ficheiro PDF
    formData.append('file', file);
    
    // 2. Anexa o DTO transformando-o num Blob JSON (Requisito do Spring Boot @RequestPart)
    const blobDados = new Blob([JSON.stringify(dados)], { type: 'application/json' });
    formData.append('dados', blobDados);

    const response = await api.post('/prestacao-contas', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Exclui um relatório
  async excluir(id: string) {
    const response = await api.delete(`/prestacao-contas/${id}`);
    return response.data;
  }
};