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
    applyTheme();
  }, []);

  return null; 
}