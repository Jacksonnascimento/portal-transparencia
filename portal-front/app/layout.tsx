'use client';

import { useEffect, useState } from 'react';
import { Inter } from 'next/font/google';
import { Landmark, Mail, Phone, MapPin, Globe, Facebook, Instagram, Twitter } from 'lucide-react';
import Link from 'next/link';
import api from '../services/api';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<any>(null);
  const brasaoUrl = "http://localhost:8080/api/v1/portal/configuracoes/brasao";

  // Busca as configurações globais (Nome, CNPJ, Endereço)
  useEffect(() => {
    api.get('/portal/configuracoes')
      .then(res => setConfig(res.data))
      .catch(err => console.error("Erro ao carregar configurações", err));
  }, []);

  return (
    <html lang="pt-br">
      <body className={`${inter.className} bg-slate-50 text-slate-900 flex flex-col min-h-screen`}>
        
        {/* --- HEADER DINÂMICO --- */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between">
            
            {/* Logo e Nome do Ente */}
            <Link href="/" className="flex items-center gap-4 group">
              <div className="h-16 w-16 flex items-center justify-center p-1 bg-slate-50 rounded-2xl border border-slate-100 group-hover:border-emerald-200 transition-all">
                <img 
                  src={`${brasaoUrl}?t=${new Date().getTime()}`} 
                  alt="Brasão" 
                  className="max-h-full w-auto object-contain"
                  onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150?text=Logo")}
                />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 uppercase leading-none tracking-tighter">
                  {config?.nomeEnte || 'Prefeitura Municipal'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                    Portal da Transparência
                  </span>
                  {config?.cnpj && (
                    <span className="text-slate-400 text-[10px] font-bold">CNPJ: {config.cnpj}</span>
                  )}
                </div>
              </div>
            </Link>

            {/* Menu Simples */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/receitas" className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors uppercase tracking-widest">Receitas</Link>
              <Link href="/despesas" className="text-sm font-bold text-slate-600 hover:text-rose-600 transition-colors uppercase tracking-widest">Despesas</Link>
              <Link href="/pessoal" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-widest">Pessoal</Link>
              <Link href="/sic" className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all">e-SIC</Link>
            </nav>
          </div>
        </header>

        {/* --- CONTEÚDO DA PÁGINA --- */}
        <main className="flex-grow">
          {children}
        </main>

        {/* --- FOOTER DINÂMICO --- */}
        <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              
              {/* Coluna 1: Institucional */}
              <div className="col-span-1 md:col-span-1">
                <div className="flex items-center gap-3 mb-6">
                  <Landmark className="text-emerald-600" size={24} />
                  <span className="font-black text-slate-900 uppercase tracking-tighter italic">Horizon AJ</span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Este portal tem como objetivo garantir o acesso à informação e a transparência pública, conforme a Lei nº 12.527/2011.
                </p>
              </div>

              {/* Coluna 2: Contato Dinâmico */}
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Contato</h4>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                    <Phone size={16} className="text-slate-400" /> {config?.telefone || '(00) 0000-0000'}
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                    <Mail size={16} className="text-slate-400" /> {config?.emailContato || 'contato@municipio.gov.br'}
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-500 font-medium">
                    <MapPin size={16} className="text-slate-400 shrink-0" /> {config?.endereco || 'Endereço não configurado'}
                  </li>
                </ul>
              </div>

              {/* Coluna 3: Links Úteis */}
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Links Úteis</h4>
                <ul className="space-y-4">
                  <li><Link href="#" className="text-sm text-slate-500 hover:text-emerald-600 font-medium transition-colors">Site Oficial</Link></li>
                  <li><Link href="#" className="text-sm text-slate-500 hover:text-emerald-600 font-medium transition-colors">Diário Oficial</Link></li>
                  <li><Link href="#" className="text-sm text-slate-500 hover:text-emerald-600 font-medium transition-colors">Portal do Contribuinte</Link></li>
                </ul>
              </div>

              {/* Coluna 4: Redes Sociais */}
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Redes Oficiais</h4>
                <div className="flex gap-4">
                  <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Facebook size={20} /></button>
                  <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-all"><Instagram size={20} /></button>
                  <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-all"><Twitter size={20} /></button>
                </div>
              </div>
            </div>

            {/* Créditos Finais */}
            <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                © 2026 {config?.nomeEnte || 'Prefeitura Municipal'} • Todos os direitos reservados
              </p>
              <div className="flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                <span className="text-[10px] font-black text-slate-900 uppercase italic">Tecnologia por</span>
                <div className="bg-emerald-600 text-white text-[9px] font-black px-2 py-1 rounded">HORIZON AJ</div>
              </div>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}