// portal-front/hooks/useConfig.ts
import { useState, useEffect } from 'react';
import { configService } from '../services/configService';

export function useConfig() {
  const [config, setConfig] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    async function load() {
      const data = await configService.getPortalConfigs();
      if (data) {
        setConfig(data);
        // CORRIGIDO: Passa a urlBrasao recebida do banco para o formatador
        setLogoUrl(`${configService.getBrasaoUrl(data.urlBrasao)}?t=${new Date().getTime()}`);
      }
    }
    load();
  }, []);

  return { config, logoUrl };
}