import api from '@/services/api';

export interface EstruturaOrganizacional {
  id?: string;
  nomeOrgao: string;
  sigla: string;
  nomeDirigente: string;
  cargoDirigente: string;
  horarioAtendimento: string;
  enderecoCompleto: string;
  telefoneContato: string;
  emailInstitucional: string;
  linkCurriculo: string;
  urlFotoDirigente?: string; // NOVO: Campo para imagem
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface FiltrosEstrutura {
  nomeOrgao?: string;
  sigla?: string;
  nomeDirigente?: string;
  cargoDirigente?: string;
}

export const estruturaService = {
  listarTodas: async (filtros?: FiltrosEstrutura) => {
    const response = await api.get('/estrutura-organizacional', { params: filtros });
    return response.data;
  },

  criar: async (dados: EstruturaOrganizacional) => {
    const response = await api.post('/estrutura-organizacional', dados);
    return response.data;
  },

  atualizar: async (id: string, dados: EstruturaOrganizacional) => {
    const response = await api.put(`/estrutura-organizacional/${id}`, dados);
    return response.data;
  },

  excluir: async (id: string) => {
    await api.delete(`/estrutura-organizacional/${id}`);
  },

  exportarCsv: async (filtros?: FiltrosEstrutura) => {
    const response = await api.get('/portal/estrutura-organizacional/exportar/csv', { 
      params: filtros, 
      responseType: 'blob' 
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Estrutura_Organizacional_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  exportarPdf: async (filtros?: FiltrosEstrutura) => {
    const response = await api.get('/portal/estrutura-organizacional/exportar/pdf', { 
      params: filtros, 
      responseType: 'blob' 
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Estrutura_Organizacional_${new Date().getTime()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};