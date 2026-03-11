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

  // ENGINE UNIVERSAL DE URLs (Selo Ouro)
  // Agora esta função serve para Brasão, Fotos de Dirigentes e Anexos do e-SIC
  getBrasaoUrl: (path?: string) => {
    if (!path) return "https://via.placeholder.com/150?text=Sem+Documento";
    if (path.startsWith("http")) return path;
    
    // Pega a URL base e garante que não termine com barra para evitar links como //api
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const cleanApiUrl = apiUrl.replace(/\/+$/, "").replace(/\/api\/v1\/?$/, "");
    
    let caminhoCorrigido = path;

    // Normaliza o prefixo caso o banco ainda tenha registros na rota antiga (/api/v1/arquivos)
    if (caminhoCorrigido.startsWith("/api/v1/arquivos/")) {
      caminhoCorrigido = caminhoCorrigido.replace("/api/v1/arquivos/", "/api/v1/portal/arquivos/");
    }

    // Garante que o caminho corrigido comece com uma única barra
    if (!caminhoCorrigido.startsWith("/")) {
        caminhoCorrigido = "/" + caminhoCorrigido;
    }
    
    return `${cleanApiUrl}${caminhoCorrigido}`;
  }
};