"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  FileUp,
  History,
  LogOut,
  Users,
  Settings,
  Building2
} from "lucide-react";
import api from "@/services/api";

export function Sidebar() {
  const pathname = usePathname();
  const [config, setConfig] = useState({
    nome: 'Horizon AJ',
    brasao: ''
  });

  useEffect(() => {
    async function loadIdentity() {
      try {
        const response = await api.get('/portal/configuracoes');
        if (response.data) {
          setConfig({
            nome: response.data.nomeEntidade || 'Horizon AJ',
            // Adicionamos um timestamp (Date.now()) para forçar o browser a não usar o cache da imagem
            brasao: response.data.urlBrasao ? `http://localhost:8080${response.data.urlBrasao}?t=${Date.now()}` : ''
          });
        }
      } catch (err) {
        console.error("Erro ao carregar marca da sidebar.");
      }
    }

    // Carrega a identidade inicial
    loadIdentity();

    // Cria um ouvinte para recarregar a identidade sempre que as configurações forem salvas
    window.addEventListener('horizon:configUpdated', loadIdentity);

    // Limpa o ouvinte quando o componente for desmontado
    return () => {
      window.removeEventListener('horizon:configUpdated', loadIdentity);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = "horizon_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.replace('/login');
  };

  const menuItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Receitas", href: "/receitas", icon: TrendingUp },
    { label: "Despesas", href: "/despesas", icon: TrendingDown },
    { label: "Auditoria", href: "/auditoria", icon: History },
    { label: "Usuários", href: "/usuarios", icon: Users },
    { label: "Configurações", href: "/configuracoes", icon: Settings } 
  ];

  return (
    <aside className="w-64 bg-[#0F172A] text-white hidden lg:flex flex-col sticky top-0 h-screen shadow-2xl z-50 border-r border-white/5">
      
      {/* Branding Dinâmico */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        {config.brasao ? (
          <img src={config.brasao} alt="Logo" className="w-10 h-10 object-contain" />
        ) : (
          <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
            <Building2 size={20} className="text-slate-500" />
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">Entidade</span>
          <h1 className="text-xs font-bold leading-tight uppercase tracking-tight line-clamp-2">
            {config.nome}
          </h1>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`
                flex items-center w-full px-4 py-2.5 rounded-xl transition-all group mb-1
                ${isActive 
                  ? 'bg-brand text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }
              `}
            >
              <Icon 
                size={18} 
                className={`mr-3 transition-colors ${!isActive ? 'group-hover:text-brand' : ''}`} 
              /> 
              <span className="text-xs font-bold uppercase tracking-wide">{item.label}</span>
            </Link>
          );
        })}

        <Link 
          href="/importar" 
          className={`
            flex items-center w-full px-4 py-2.5 rounded-xl transition-all border-t border-slate-800 pt-6 mt-6 group
            ${pathname === '/importar' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}
          `}
        >
          <FileUp size={18} className="mr-3 group-hover:text-brand transition-colors" /> 
          <span className="text-xs font-bold uppercase tracking-wide">Importar Dados</span>
        </Link>

        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2.5 mt-4 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all group font-black text-[10px] uppercase tracking-widest"
        >
          <LogOut size={18} className="mr-3" />
          Sair do Sistema
        </button>
      </nav>
      
      {/* Footer Horizon AJ com cor fixa exigida */}
      <div className="p-6 bg-black/20">
        <h2 className="text-[11px] font-black italic text-center tracking-tighter text-slate-400">
           HORIZON <span className="text-[#4242d1]">AJ</span>
        </h2>
      </div>
    </aside>
  );
}