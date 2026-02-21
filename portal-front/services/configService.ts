// portal-front/services/configService.ts
import api from './api';

export const configService = {
  // Busca Nome, CNPJ, Endereço, etc.
  getPortalConfigs: async () => {
    try {
      const response = await api.get('/portal/configuracoes');
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar configurações do portal", error);
      return null;
    }
  },

  // Retorna a URL exata do endpoint que serve a imagem do Brasão
  getBrasaoUrl: () => {
    // Pegamos a URL base do seu arquivo api.ts (ex: http://localhost:8080/api/v1)
    const baseUrl = api.defaults.baseURL;
    return `${baseUrl}/portal/configuracoes/brasao`;
  }
};