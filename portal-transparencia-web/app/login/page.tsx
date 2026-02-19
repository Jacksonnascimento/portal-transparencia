'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '@/services/api'; // Ajuste o caminho se a sua configuração do axios estiver noutro lugar

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    try {
      // Bate no nosso novo endpoint do Backend
      const response = await api.post('/auth/login', { email, senha });
      
      const { token, nome, role } = response.data;

      // Guarda o Token num Cookie (Válido por 2 horas, igual ao Backend)
      // O path=/ garante que o token está disponível em todo o site
      document.cookie = `horizon_token=${token}; path=/; max-age=7200; SameSite=Strict`;
      
      // Guarda os dados do utilizador no localStorage para usar no cabeçalho/sidebar
      localStorage.setItem('@Horizon:nome', nome);
      localStorage.setItem('@Horizon:role', role);

      // Redireciona para as Receitas (ou Dashboard)
      router.push('/');
      
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        setErro('Credenciais inválidas. Verifique o seu e-mail e senha.');
      } else {
        setErro('Erro ao conectar com o servidor. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans">
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Cabeçalho do Card */}
        <div className="bg-black p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          <div className="relative z-10 flex flex-col items-center">
            <ShieldCheck size={48} className="mb-4 text-slate-300" />
            <h1 className="text-2xl font-black tracking-tight">Horizon AJ</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-2">
              Acesso Restrito • Retaguarda
            </p>
          </div>
        </div>

        {/* Formulário */}
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-slate-700 font-medium"
                    placeholder="usuario@horizon.com.br"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-slate-700 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 bg-black text-white font-bold rounded-xl hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? 'Autenticando...' : 'Entrar no Sistema'}
              {!loading && <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>

        {/* Rodapé */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Uso Exclusivo para Gestores Autorizados
          </p>
        </div>
      </div>
    </div>
  );
}