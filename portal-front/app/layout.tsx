'use client';

import { useEffect, useState } from 'react';
import { Inter } from 'next/font/google';
import { 
  Landmark, Mail, Phone, MapPin, Facebook, Instagram, Twitter,
  Accessibility, ZoomIn, ZoomOut, Contrast, Palette, EyeOff, Link as LinkIcon, Type, RotateCcw, X, MessageSquare, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import api from '../services/api';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<any>(null);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  
  // ESTADO LGPD (Banner de Cookies)
  const [showCookies, setShowCookies] = useState(false);

  const brasaoUrl = "http://localhost:8080/api/v1/portal/configuracoes/brasao";

  // ESTADOS DO MENU DE ACESSIBILIDADE
  const [isA11yOpen, setIsA11yOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100); 
  const [isGrayscale, setIsGrayscale] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isNegative, setIsNegative] = useState(false);
  const [isUnderlined, setIsUnderlined] = useState(false);
  const [isLegibleFont, setIsLegibleFont] = useState(false);

  useEffect(() => {
    api.get('/portal/configuracoes')
      .then(res => setConfig(res.data))
      .catch(err => console.error("Erro ao carregar configurações", err))
      .finally(() => setIsConfigLoaded(true));

    // Verifica LGPD: se o usuário já aceitou os cookies antes
    if (!localStorage.getItem('lgpd_cookies_accepted')) {
      setShowCookies(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('lgpd_cookies_accepted', 'true');
    setShowCookies(false);
  };

  if (!isConfigLoaded) {
    return (
      <html lang="pt-br">
        <body className={`${inter.className} bg-slate-50 flex items-center justify-center min-h-screen`}>
           <div className="animate-pulse text-slate-300 font-black uppercase tracking-widest text-[10px]">
             Preparando Portal...
           </div>
        </body>
      </html>
    );
  }

  const corPrimaria = config?.corPrincipal || '#059669'; 
  const corFundoLight = `${corPrimaria}1A`; 
  const corHover = `${corPrimaria}CC`; 

  const changeZoom = (amount: number) => setZoomLevel(prev => Math.min(Math.max(prev + amount, 80), 150)); 
  const resetA11y = () => {
    setZoomLevel(100); setIsGrayscale(false); setIsHighContrast(false);
    setIsNegative(false); setIsUnderlined(false); setIsLegibleFont(false);
  };

  return (
    <html lang="pt-br">
      <head>
        <style>{`
          :root { --cor-primaria: ${corPrimaria}; --cor-primaria-fundo: ${corFundoLight}; --cor-primaria-hover: ${corHover}; }
          html {
            font-size: ${zoomLevel}% !important;
            filter: ${isGrayscale ? 'grayscale(100%) ' : ''} ${isHighContrast ? 'contrast(130%) saturate(120%) ' : ''} ${isNegative ? 'invert(100%) hue-rotate(180deg) ' : ''};
            transition: filter 0.3s ease, font-size 0.3s ease;
          }
          ${isNegative ? 'img, video { filter: invert(100%) hue-rotate(180deg); }' : ''}
          ${isUnderlined ? 'a { text-decoration: underline !important; text-underline-offset: 4px; }' : ''}
          ${isLegibleFont ? '* { font-family: Arial, Helvetica, sans-serif !important; letter-spacing: 0.05em !important; }' : ''}
        `}</style>
      </head>
      <body className={`${inter.className} bg-slate-50 text-slate-900 flex flex-col min-h-screen animate-in fade-in duration-500 relative`}>
        
        {/* WIDGET ACESSIBILIDADE */}
        <div className="fixed right-0 top-1/3 z-50 flex items-start">
          {isA11yOpen && (
            <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 mr-2 w-64 animate-in slide-in-from-right-4 duration-200">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <span className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Acessibilidade</span>
                <button onClick={() => setIsA11yOpen(false)} className="text-slate-400 hover:text-rose-500"><X size={16}/></button>
              </div>
              <div className="space-y-1.5 flex flex-col">
                <A11yBtn icon={<ZoomIn size={14}/>} label="Aumentar Texto" onClick={() => changeZoom(10)} />
                <A11yBtn icon={<ZoomOut size={14}/>} label="Diminuir Texto" onClick={() => changeZoom(-10)} />
                <A11yBtn icon={<Palette size={14}/>} label="Escala de Cinza" active={isGrayscale} onClick={() => setIsGrayscale(!isGrayscale)} />
                <A11yBtn icon={<Contrast size={14}/>} label="Alto Contraste" active={isHighContrast} onClick={() => setIsHighContrast(!isHighContrast)} />
                <A11yBtn icon={<EyeOff size={14}/>} label="Contraste Negativo" active={isNegative} onClick={() => setIsNegative(!isNegative)} />
                <A11yBtn icon={<LinkIcon size={14}/>} label="Sublinhar Links" active={isUnderlined} onClick={() => setIsUnderlined(!isUnderlined)} />
                <A11yBtn icon={<Type size={14}/>} label="Fonte Legível" active={isLegibleFont} onClick={() => setIsLegibleFont(!isLegibleFont)} />
                <button onClick={resetA11y} className="mt-2 flex items-center gap-3 w-full p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors text-xs font-bold">
                  <RotateCcw size={14} /> Restaurar Padrão
                </button>
              </div>
            </div>
          )}
          <button onClick={() => setIsA11yOpen(!isA11yOpen)} className="bg-[var(--cor-primaria)] text-white p-3.5 rounded-l-2xl shadow-lg hover:pr-5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--cor-primaria)]" aria-label="Menu de Acessibilidade">
            <Accessibility size={24} />
          </button>
        </div>

        {/* CABEÇALHO */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="h-16 w-16 flex items-center justify-center p-1 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[var(--cor-primaria)] transition-all">
                <img src={`${brasaoUrl}?t=${new Date().getTime()}`} alt="Brasão" className="max-h-full w-auto object-contain" onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150?text=Logo")}/>
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 uppercase leading-none tracking-tighter">{config?.nomeEnte || 'Prefeitura Municipal'}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-[var(--cor-primaria)] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Portal da Transparência</span>
                  {config?.cnpj && <span className="text-slate-400 text-[10px] font-bold">CNPJ: {config.cnpj}</span>}
                </div>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/receitas" className="text-sm font-bold text-slate-600 hover:text-[var(--cor-primaria)] transition-colors uppercase tracking-widest">Receitas</Link>
              <Link href="/despesas" className="text-sm font-bold text-slate-600 hover:text-[var(--cor-primaria)] transition-colors uppercase tracking-widest">Despesas</Link>
              <Link href="/pessoal" className="text-sm font-bold text-slate-600 hover:text-[var(--cor-primaria)] transition-colors uppercase tracking-widest">Pessoal</Link>
              <Link href="/sic" className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[var(--cor-primaria-hover)] transition-all">e-SIC</Link>
            </nav>
          </div>
        </header>

        <main className="flex-grow">{children}</main>

        {/* RODAPÉ */}
        <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
              <div className="col-span-1 md:col-span-1">
                <div className="flex items-center gap-3 mb-6">
                  <Landmark className="text-[var(--cor-primaria)]" size={24} />
                  <span className="font-black text-slate-900 uppercase tracking-tighter italic">Horizon AJ</span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">Este portal tem como objetivo garantir o acesso à informação e a transparência pública, conforme a Lei nº 12.527/2011.</p>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Contato</h4>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-sm text-slate-500 font-medium"><Phone size={16} className="text-[var(--cor-primaria)]" /> {config?.telefone || '(00) 0000-0000'}</li>
                  <li className="flex items-center gap-3 text-sm text-slate-500 font-medium"><Mail size={16} className="text-[var(--cor-primaria)]" /> {config?.emailContato || 'contato@municipio.gov.br'}</li>
                  <li className="flex items-start gap-3 text-sm text-slate-500 font-medium"><MapPin size={16} className="text-[var(--cor-primaria)] shrink-0" /> {config?.endereco || 'Endereço não configurado'}</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Ouvidoria</h4>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-sm text-slate-500 font-medium"><MessageSquare size={16} className="text-[var(--cor-primaria)]" /> {config?.ouvidoriaNome || 'Ouvidoria Geral'}</li>
                  <li className="flex items-center gap-3 text-sm text-slate-500 font-medium"><Phone size={16} className="text-[var(--cor-primaria)]" /> {config?.ouvidoriaTelefone || '156'}</li>
                  <li className="flex items-center gap-3 text-sm text-slate-500 font-medium"><Mail size={16} className="text-[var(--cor-primaria)]" /> {config?.ouvidoriaEmail || 'ouvidoria@municipio.gov.br'}</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Links Úteis</h4>
                <ul className="space-y-4">
                  <li><Link href="#" className="text-sm text-slate-500 hover:text-[var(--cor-primaria)] font-medium transition-colors">Site Oficial</Link></li>
                  <li><Link href="#" className="text-sm text-slate-500 hover:text-[var(--cor-primaria)] font-medium transition-colors">Diário Oficial</Link></li>
                  <li><Link href="#" className="text-sm text-slate-500 hover:text-[var(--cor-primaria)] font-medium transition-colors">Portal do Contribuinte</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Redes Oficiais</h4>
                <div className="flex gap-4">
                  <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-[var(--cor-primaria)] hover:bg-[var(--cor-primaria-fundo)] transition-all"><Facebook size={20} /></button>
                  <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-[var(--cor-primaria)] hover:bg-[var(--cor-primaria-fundo)] transition-all"><Instagram size={20} /></button>
                  <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-all"><Twitter size={20} /></button>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  © 2026 {config?.nomeEnte || 'Prefeitura Municipal'} • Todos os direitos reservados
                </p>
                {/* LINKS DA LGPD */}
                <div className="flex gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l-0 md:border-l border-slate-200 md:pl-4">
                  <Link href="/privacidade" className="hover:text-[var(--cor-primaria)] transition-colors">Política de Privacidade</Link>
                  <Link href="/termos" className="hover:text-[var(--cor-primaria)] transition-colors">Termos de Uso</Link>
                </div>
              </div>
              
              <Link href="https://horizonaj.com.br/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 cursor-pointer" aria-label="Desenvolvido por Horizon AJ">
                <span className="text-[10px] font-black text-slate-900 uppercase italic">Desenvolvido por</span>
                <div className="bg-[var(--cor-primaria)] text-white text-[9px] font-black px-2 py-1 rounded">HORIZON AJ</div>
              </Link>
            </div>
          </div>
        </footer>

        {/* ========================================== */}
        {/* BANNER DE COOKIES LGPD (Flutuante na base) */}
        {/* ========================================== */}
        {showCookies && (
          <div className="fixed bottom-4 left-4 right-4 md:left-8 md:right-auto md:max-w-md bg-slate-900 text-white p-5 rounded-2xl shadow-2xl z-50 flex flex-col gap-4 animate-in slide-in-from-bottom-5">
            <div className="flex gap-3 items-start">
              <ShieldCheck className="text-[var(--cor-primaria)] shrink-0" size={24} />
              <div>
                <h4 className="font-bold text-sm mb-1">Privacidade e Cookies</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Utilizamos cookies para melhorar sua experiência e garantir o cumprimento da LGPD. Ao continuar navegando, você concorda com a nossa <Link href="/privacidade" className="text-[var(--cor-primaria)] hover:underline">Política de Privacidade</Link>.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={acceptCookies} className="bg-[var(--cor-primaria)] text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all">
                Entendi e Aceito
              </button>
            </div>
          </div>
        )}

      </body>
    </html>
  );
}

function A11yBtn({ icon, label, onClick, active = false }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 w-full p-2.5 rounded-xl transition-all text-xs font-bold ${active ? 'bg-[var(--cor-primaria)] text-white shadow-md' : 'bg-transparent text-slate-600 hover:bg-slate-50 hover:text-[var(--cor-primaria)]'}`}>
      {icon} {label}
    </button>
  );
}