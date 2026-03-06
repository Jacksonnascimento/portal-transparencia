import api from './api';

export interface DiariaRequest {
  exercicio: number;
  orgaoId?: number;
  nomeFavorecido: string;
  cargoFavorecido?: string;
  cpfCnpjFavorecido?: string;
  destinoViagem: string;
  motivoViagem: string;
  dataSaida: string;
  dataRetorno: string;
  quantidadeDiarias?: number;
  valorDiarias?: number;
  valorPassagens?: number;
  valorDevolvido?: number;
  numeroProcesso?: string;
  portariaConcessao?: string;
}

export interface DiariaResponse extends DiariaRequest {
  id: number;
  valorTotal: number;
  ativo: boolean;
  dataCriacao: string;
  dataAtualizacao?: string;
}

interface DiariaParams {
  page?: number;
  size?: number;
  exercicio?: number | string;
  nomeFavorecido?: string;
  destinoViagem?: string;
  numeroProcesso?: string;
}

const diariaService = {
  // --- CRUD BÁSICO ---
  listar: async (params: DiariaParams) => {
    const response = await api.get('/admin/diarias', { params });
    return response.data;
  },

  buscarPorId: async (id: number) => {
    const response = await api.get(`/admin/diarias/${id}`);
    return response.data;
  },

  criar: async (data: DiariaRequest) => {
    const response = await api.post('/admin/diarias', data);
    return response.data;
  },

  atualizar: async (id: number, data: DiariaRequest) => {
    const response = await api.put(`/admin/diarias/${id}`, data);
    return response.data;
  },

  excluir: async (id: number) => {
    await api.delete(`/admin/diarias/${id}`);
  },

  obterAnos: async () => {
    const response = await api.get('/portal/diarias/anos');
    return response.data;
  },

  // --- EXPORTAÇÃO (DOWNLOAD DE ARQUIVOS) ---

  exportarCsv: async (params: DiariaParams) => {
    const response = await api.get('/admin/diarias/exportar/csv', {
      params,
      responseType: 'blob', // Essencial para arquivos
    });
    triggerDownload(response.data, `diarias_${Date.now()}.csv`);
  },

  exportarPdf: async (params: DiariaParams) => {
    const response = await api.get('/admin/diarias/exportar/pdf', {
      params,
      responseType: 'blob',
    });
    triggerDownload(response.data, `diarias_${Date.now()}.pdf`);
  },
};

/**
 * Função utilitária para disparar o download no navegador
 */
function triggerDownload(data: Blob, filename: string) {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export default diariaService;