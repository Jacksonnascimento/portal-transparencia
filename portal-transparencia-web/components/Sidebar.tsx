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
  Building2,
  HelpCircle,
  BookOpen,
  MessageSquare,
  Scale,
  Plane,
  Network,
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import api from "@/services/api";

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [config, setConfig] = useState({
    nome: 'Horizon AJ',
    brasao: ''
  });

  // Menu organizado por categorias estratégicas
  const menuCategories = [
    {
      title: "Visão Geral",
      items: [
        { label: "Dashboard", href: "/", icon: LayoutDashboard }
      ]
    },
    {
      title: "Transparência Fiscal",
      items: [
        { label: "Receitas", href: "/receitas", icon: TrendingUp },
        { label: "Despesas", href: "/despesas", icon: TrendingDown },
        { label: "Dívida Ativa", href: "/divida-ativa", icon: Scale },
        { label: "Diárias e Passagens", href: "/diarias", icon: Plane }
      ]
    },
    {
      title: "Institucional & Serviços",
      items: [
        { label: "Órgãos e Dirigentes", href: "/estrutura-organizacional", icon: Network },
        { label: "Carta de Serviços", href: "/servicos", icon: BookOpen },
        { label: "Gestão do e-SIC", href: "/e-sic", icon: MessageSquare },
        { label: "Gestão de FAQ", href: "/faq", icon: HelpCircle }
      ]
    },
    {
      title: "Administração",
      items: [
        { label: "Importar Dados", href: "/importar", icon: FileUp },
        { label: "Auditoria", href: "/auditoria", icon: History },
        { label: "Usuários", href: "/usuarios", icon: Users },
        { label: "Configurações", href: "/configuracoes", icon: Settings }
      ]
    }
  ];

  // Carrega configurações (Brasão e Nome)
  useEffect(() => {
    async function loadIdentity() {
      try {
        const response = await api.get('/portal/configuracoes');
        if (response.data) {
          setConfig({
            nome: response.data.nomeEntidade || 'Horizon AJ',
            brasao: response.data.urlBrasao ? `${process.env.NEXT_PUBLIC_API_URL || ''}${response.data.urlBrasao}?t=${Date.now()}` : ''
          });
        }
      } catch (err) {
        console.error("Erro ao carregar marca da sidebar.");
      }
    }

    loadIdentity();
    window.addEventListener('horizon:configUpdated', loadIdentity);
    return () => {
      window.removeEventListener('horizon:configUpdated', loadIdentity);
    };
  }, []);

  // Controla o fechamento no mobile e abertura automática do submenu baseado na rota ativa
  useEffect(() => {
    setIsMobileOpen(false);
    
    // Encontra qual categoria possui o link ativo no momento
    const activeCategory = menuCategories.find(cat => 
      cat.items.some(item => item.href === pathname)
    );
    
    if (activeCategory && !openCategories.includes(activeCategory.title)) {
      setOpenCategories(prev => [...prev, activeCategory.title]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = "horizon_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.replace('/login');
  };

  const toggleCategory = (title: string) => {
    setOpenCategories(prev => 
      prev.includes(title) 
        ? prev.filter(c => c !== title) 
        : [...prev, title]
    );
  };

  // Lógica de filtro da barra de pesquisa
  const filteredCategories = menuCategories.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <>
      {/* Botão Hambúrguer (Mobile) */}
      {!isMobileOpen && (
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-[40] p-2 bg-slate-900 text-white rounded-lg shadow-lg border border-slate-700 hover:bg-slate-800 transition-colors"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Overlay Escuro para Mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Principal */}
      <aside 
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-72 bg-[#0F172A] text-white flex flex-col shadow-2xl z-[100] border-r border-white/5 transition-transform duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header da Sidebar */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            {config.brasao ? (
              <img src={config.brasao} alt="Logo" className="w-10 h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                <Building2 size={20} className="text-slate-500" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">Entidade</span>
              <h1 className="text-xs font-bold leading-tight uppercase tracking-tight line-clamp-2" title={config.nome}>
                {config.nome}
              </h1>
            </div>
          </div>
          
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Barra de Pesquisa */}
        <div className="px-4 py-4 border-b border-slate-800 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Pesquisar módulo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 text-white text-xs rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand placeholder:text-slate-500 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Navegação e Categorias - Scroll escondido nativamente */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category, idx) => {
              // Se tiver pesquisando algo, abre tudo. Se não, verifica o state
              const isOpen = searchTerm.length > 0 || openCategories.includes(category.title);

              return (
                <div key={idx} className="mb-2">
                  <button 
                    onClick={() => toggleCategory(category.title)}
                    className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* AQUI FOI ALTERADO O TAMANHO E O CONTRASTE DO TÍTULO DA CATEGORIA */}
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider group-hover:text-slate-300 transition-colors">
                      {category.title}
                    </span>
                    {isOpen ? (
                      <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-300" />
                    ) : (
                      <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-300" />
                    )}
                  </button>

                  <div 
                    className={`
                      space-y-1 overflow-hidden transition-all duration-300 ease-in-out
                      ${isOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}
                    `}
                  >
                    {category.items.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;

                      return (
                        <Link 
                          key={item.href} 
                          href={item.href}
                          className={`
                            flex items-center w-full px-4 py-2.5 rounded-xl transition-all group
                            ${isActive 
                              ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                              : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                            }
                          `}
                        >
                          <Icon 
                            size={18} 
                            className={`mr-3 transition-colors ${isActive ? 'text-white' : 'group-hover:text-white'}`} 
                          /> 
                          <span className="text-xs font-bold uppercase tracking-wide">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-6 text-center text-slate-500">
              <p className="text-xs font-medium">Nenhum módulo encontrado.</p>
            </div>
          )}
        </nav>
        
        {/* Rodapé da Sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all group font-black text-[10px] uppercase tracking-widest mb-4 border border-transparent hover:border-red-500/20"
          >
            <LogOut size={16} className="mr-2" />
            Encerrar Sessão
          </button>

          <div className="flex justify-center">
            <a 
              href="https://horizonaj.com.br/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-70 transition-opacity cursor-pointer"
            >
              <h2 className="text-[11px] font-black italic text-center tracking-tighter text-slate-500">
                  HORIZON <span className="text-[#4242d1]">AJ</span>
              </h2>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}