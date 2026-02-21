'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle, ArrowRight, Building2 } from 'lucide-react';
import api from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  
  // ESTADO DE CONTROLO VISUAL: Garante que a interface só é renderizada após obter a identidade do órgão
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  
  const [config, setConfig] = useState({
    nome: 'Horizon AJ',
    brasao: '',
    cor: '#0f172a' // Cor neutra institucional padrão (slate-900)
  });

  useEffect(() => {
    async function loadIdentity() {
      try {
        const response = await api.get('/portal/configuracoes');
        setConfig({
          nome: response.data.nomeEntidade || 'Horizon AJ',
          brasao: response.data.urlBrasao ? `http://localhost:8080${response.data.urlBrasao}` : '',
          cor: response.data.corPrincipal || '#0f172a'
        });
      } catch (err) {
        console.error("Não foi possível carregar a identidade visual da entidade.");
      } finally {
        // Removemos o skeleton loader independentemente de sucesso ou erro na API
        setIsLoadingConfig(false);
      }
    }
    loadIdentity();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    try {
      const response = await api.post('/auth/login', { email, senha });
      const { token, nome, role } = response.data;

      // Armazenamento seguro de credenciais
      document.cookie = `horizon_token=${token}; path=/; max-age=7200; SameSite=Strict`;
      localStorage.setItem('@Horizon:nome', nome);
      localStorage.setItem('@Horizon:role', role);

      router.push('/');
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        setErro('Credenciais inválidas. Verifique o seu e-mail e palavra-passe.');
      } else {
        setErro('Erro de comunicação com o servidor. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  // TELA DE CARREGAMENTO AUSTERA (Padrão Institucional / Skeleton)
  // Evita o "piscar" de ecrã e mantém a estabilidade do layout (Cumulative Layout Shift - CLS)
  if (isLoadingConfig) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm animate-pulse">
          {/* Cabeçalho Neutro */}
          <div className="h-56 bg-slate-200/70 flex flex-col items-center justify-center p-10">
            <div className="w-24 h-24 bg-slate-300 rounded-full mb-4"></div>
            <div className="w-48 h-6 bg-slate-300 rounded"></div>
            <div className="w-32 h-3 bg-slate-300 rounded mt-4"></div>
          </div>
          
          {/* Corpo do Formulário Neutro */}
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <div className="w-16 h-3 bg-slate-200 rounded mb-2"></div>
                <div className="w-full h-12 bg-slate-100 rounded-xl border border-slate-100"></div>
              </div>
              <div>
                <div className="w-16 h-3 bg-slate-200 rounded mb-2"></div>
                <div className="w-full h-12 bg-slate-100 rounded-xl border border-slate-100"></div>
              </div>
            </div>
            <div className="w-full h-14 bg-slate-200 rounded-xl mt-4"></div>
          </div>
        </div>
        <p className="mt-8 text-[10px] text-slate-300 font-bold uppercase tracking-widest">
          A carregar ambiente seguro...
        </p>
      </div>
    );
  }

  // TELA PRINCIPAL DE AUTENTICAÇÃO
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Cabeçalho do Card Dinâmico */}
        <div 
          className="p-10 text-center text-white relative overflow-hidden transition-colors duration-700"
          style={{ backgroundColor: config.cor }}
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            {config.brasao ? (
              <img src={config.brasao} alt={`Brasão de ${config.nome}`} className="w-24 h-24 object-contain mb-4 drop-shadow-lg" />
            ) : (
              <Building2 size={56} className="mb-4 text-white/50" />
            )}
            <h1 className="text-2xl font-black tracking-tight uppercase">{config.nome}</h1>
            <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold mt-2">
              Acesso Restrito ao Painel de Gestão
            </p>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {erro && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-100 text-sm animate-in shake">
                <AlertCircle className="mr-3 flex-shrink-0" size={18} />
                <span className="font-medium">{erro}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all text-slate-800"
                    placeholder="auditor@horizon.com.br"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Palavra-passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all text-slate-800"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: config.cor }}
              className="w-full flex items-center justify-center py-4 px-4 text-white font-bold rounded-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-50 group shadow-lg transition-all"
            >
              {loading ? 'A Autenticar...' : 'Entrar no Sistema'}
              {!loading && <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>
      </div>
      <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        Powered by Horizon AJ Desenvolvimento
      </p>
    </div>
  );
}