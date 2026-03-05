"use client";

import { useEffect } from "react";
import api from "@/services/api";

export function ThemeHandler() {
  useEffect(() => {
    async function applyTheme() {
      try {
        const { data } = await api.get('/portal/configuracoes');
        if (data.corPrincipal) {
          // Injeta a cor do banco na variável global do CSS
          document.documentElement.style.setProperty('--brand-color', data.corPrincipal);
        }
      } catch (e) {
        console.error("Erro ao aplicar tema dinâmico");
      }
    }
    
    // Aplica no carregamento inicial
    applyTheme();

    // Adiciona o listener para atualizar em tempo real quando mudar no painel
    window.addEventListener('horizon:configUpdated', applyTheme);
    
    // Limpeza de memória
    return () => {
      window.removeEventListener('horizon:configUpdated', applyTheme);
    };
  }, []);

  return null; 
}