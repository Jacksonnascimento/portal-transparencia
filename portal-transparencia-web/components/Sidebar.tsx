"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  FileUp,
  History,
  LogOut 
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    // 1. Limpa TUDO: localStorage e sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // 2. Redirecionamento físico para quebrar o cache do Next.js
    window.location.href = '/login';
  };

  const menuItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard, activeColor: "text-blue-400" },
    { label: "Receitas", href: "/receitas", icon: TrendingUp, activeColor: "text-green-400" },
    { label: "Despesas", href: "/despesas", icon: TrendingDown, activeColor: "text-red-400" },
    { label: "Auditoria", href: "/auditoria", icon: History, activeColor: "text-purple-400" }
  ];

  return (
    <aside className="w-64 bg-[#0F172A] text-white hidden lg:flex flex-col sticky top-0 h-screen shadow-2xl z-50">
      
      <div className="p-5 border-b border-slate-800">
        <h1 className="text-xl font-black tracking-tighter italic text-blue-500">
          HORIZON <span className="text-white">AJ</span>
        </h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`
                flex items-center w-full px-4 py-2 rounded-lg transition-all group mb-1
                ${isActive 
                  ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/40' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              <Icon 
                size={18} 
                className={`mr-3 ${!isActive ? `group-hover:${item.activeColor}` : ''}`} 
              /> 
              {item.label}
            </Link>
          );
        })}

        <Link 
          href="/importar" 
          className={`
            flex items-center w-full px-4 py-2 rounded-lg transition-all border-t border-slate-800 pt-4 mt-4 group
            ${pathname === '/importar' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
          `}
        >
          <FileUp size={18} className="mr-3 group-hover:text-blue-400" /> 
          Importar Dados
        </Link>

        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 mt-4 text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded-lg transition-all group font-bold text-xs uppercase"
        >
          <LogOut size={18} className="mr-3" />
          Sair do Sistema
        </button>
      </nav>
      
      <div className="p-4 text-[10px] text-slate-500 text-center border-t border-slate-800 leading-relaxed">
        &copy; 2026 <a href="https://horizonaj.com.br/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 underline font-bold">Horizon AJ Desenvolvimento</a>. <br/> Todos os direitos reservados.
      </div>
    </aside>
  );
}