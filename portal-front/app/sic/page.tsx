'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Home, ChevronRight, MapPin, Clock, Phone, Mail, 
  Send, ShieldCheck, FileText, MessageSquare, Star, Search, CheckCircle, BarChart3
} from 'lucide-react';
import api from '../../services/api'; // Ajuste o caminho

export default function SicOuvidoriaPage() {
  // 1. Estados do Formulário e-SIC
  const [formData, setFormData] = useState({
    nome: '', documento: '', email: '', tipoSolicitacao: '', mensagem: '', sigilo: false
  });
  const [enviando, setEnviando] = useState(false);
  const [protocoloGerado, setProtocoloGerado] = useState<string | null>(null);

  // 2. Estados da Consulta de Protocolo
  const [protocoloBusca, setProtocoloBusca] = useState('');
  const [documentoBusca, setDocumentoBusca] = useState('');
  const [buscandoProtocolo, setBuscandoProtocolo] = useState(false);
  const [resultadoProtocolo, setResultadoProtocolo] = useState<any>(null);
  const [erroProtocolo, setErroProtocolo] = useState('');

  // 3. Estados da Pesquisa de Satisfação
  const [satisfacao, setSatisfacao] = useState({ nota: 0, comentario: '' });
  const [enviandoSatisfacao, setEnviandoSatisfacao] = useState(false);
  const [satisfacaoEnviada, setSatisfacaoEnviada] = useState(false);

  // --- FUNÇÕES DE INTEGRAÇÃO ALINHADAS AOS CONTROLLERS ---

  const handleEnviarSolicitacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      // MAPEAMENTO: Ajustando as chaves do front para o DTO do Back-end
      const payloadSic = {
        nome: formData.nome,
        email: formData.email,
        documento: formData.documento,
        assunto: formData.tipoSolicitacao, // Map para 'assunto'
        descricao: formData.mensagem,      // Map para 'descricao'
        anonimo: formData.sigilo           // Map para 'anonimo'
      };

      // POST: /api/v1/portal/sic/solicitacoes
      const response = await api.post('/portal/sic/solicitacoes', payloadSic);
      setProtocoloGerado(response.data?.protocolo || `REQ-${Math.floor(Math.random() * 10000)}`);
      setFormData({ nome: '', documento: '', email: '', tipoSolicitacao: '', mensagem: '', sigilo: false });
    } catch (error) {
      console.error("Erro ao enviar e-SIC:", error);
      alert("Erro ao enviar a solicitação. Verifique se todos os campos estão preenchidos corretamente.");
    } finally {
      setEnviando(false);
    }
  };

  const handleConsultarProtocolo = async () => {
    if (!protocoloBusca.trim() || !documentoBusca.trim()) {
      setErroProtocolo('Informe o protocolo e o CPF/CNPJ.');
      return;
    }
    
    setBuscandoProtocolo(true);
    setErroProtocolo('');
    setResultadoProtocolo(null);
    try {
      // GET: /api/v1/portal/sic/solicitacoes/{protocolo}?documento={documento}
      const response = await api.get(`/portal/sic/solicitacoes/${protocoloBusca}`, {
        params: { documento: documentoBusca }
      });
      setResultadoProtocolo(response.data);
    } catch (error: any) {
      console.error("Erro na busca:", error);
      setErroProtocolo(error.response?.status === 404 ? 'Protocolo não encontrado.' : 'Acesso negado ou erro no servidor.');
    } finally {
      setBuscandoProtocolo(false);
    }
  };

  const handleEnviarSatisfacao = async () => {
    if (satisfacao.nota === 0) return alert('Por favor, selecione uma nota de 1 a 5 estrelas.');
    setEnviandoSatisfacao(true);
    try {
      // MAPEAMENTO: Adicionando a urlPagina exigida pelo PesquisaSatisfacaoRequestDTO
      const payloadSatisfacao = {
        nota: satisfacao.nota,
        comentario: satisfacao.comentario,
        urlPagina: window.location.pathname
      };

      // POST: /api/v1/portal/satisfacao
      await api.post('/portal/satisfacao', payloadSatisfacao);
      setSatisfacaoEnviada(true);
    } catch (error) {
      console.error("Erro ao enviar satisfação:", error);
      alert("Erro ao registrar avaliação.");
    } finally {
      setEnviandoSatisfacao(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans animate-in fade-in duration-500">
      
      {/* BREADCRUMB */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8">
        <Link href="/" className="hover:text-[var(--cor-primaria)] transition-colors flex items-center gap-1">
          <Home size={12} /> Início
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <span className="text-slate-600">SIC e Ouvidoria</span>
      </nav>

      {/* HEADER */}
      <div className="bg-[var(--cor-primaria)] text-white p-10 md:p-14 rounded-[3rem] shadow-lg mb-10 relative overflow-hidden">
        <MessageSquare className="absolute -right-10 -bottom-10 opacity-10" size={250} />
        <div className="relative z-10 max-w-3xl">
          <div className="bg-white/20 inline-flex p-3 rounded-2xl mb-6 backdrop-blur-sm">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            SIC e Ouvidoria Municipal
          </h1>
          <p className="text-white/80 font-medium text-sm md:text-base leading-relaxed">
            O Serviço de Informação ao Cidadão (SIC) é o seu canal direto com a administração pública. 
            Solicite informações, denúncias ou acompanhe pedidos de forma segura e transparente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* LADO ESQUERDO: SIC Físico, Consulta e Avaliação */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-6 flex items-center gap-2">
              <MapPin className="text-[var(--cor-primaria)]" size={24} /> Atendimento Presencial
            </h2>
            <div className="space-y-6">
              <InfoRow icon={<MapPin size={18} />} label="Endereço do SIC Físico" value="Praça da Matriz, 01 - Centro Administrativo. Térreo, Sala 02." />
              <InfoRow icon={<Clock size={18} />} label="Horário de Atendimento" value="Segunda a Sexta-feira, das 08:00h às 14:00h." />
              <InfoRow icon={<Phone size={18} />} label="Telefones de Contato" value="(00) 3000-0000 / 0800 000 0000" />
              <InfoRow icon={<Mail size={18} />} label="E-mail Institucional" value="ouvidoria@horizon.com.br" />
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-md">
            <h3 className="text-lg font-black tracking-tight mb-3 flex items-center gap-2">
              <FileText className="text-[var(--cor-primaria)]" size={20} /> Acompanhe seu Pedido
            </h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Consulte o andamento da sua solicitação informando o número do protocolo e o seu documento.
            </p>
            
            <div className="space-y-2 mb-4">
              <div className="flex bg-white/10 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-[var(--cor-primaria)] transition-all">
                <input 
                  type="text" placeholder="Nº do Protocolo..." 
                  value={protocoloBusca} onChange={(e) => setProtocoloBusca(e.target.value)}
                  className="w-full bg-transparent text-white placeholder:text-slate-500 px-3 outline-none text-sm font-bold"
                />
              </div>
              <div className="flex bg-white/10 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-[var(--cor-primaria)] transition-all">
                <input 
                  type="text" placeholder="CPF/CNPJ do Solicitante..." 
                  value={documentoBusca} onChange={(e) => setDocumentoBusca(e.target.value)}
                  className="w-full bg-transparent text-white placeholder:text-slate-500 px-3 outline-none text-sm font-bold"
                />
                <button 
                  type="button" onClick={handleConsultarProtocolo} disabled={buscandoProtocolo || !documentoBusca || !protocoloBusca}
                  className="bg-[var(--cor-primaria)] hover:bg-white hover:text-slate-900 transition-colors px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1 disabled:opacity-50 shrink-0"
                >
                  {buscandoProtocolo ? '...' : <><Search size={14}/> Buscar</>}
                </button>
              </div>
            </div>

            {erroProtocolo && <div className="bg-red-500/20 text-red-200 text-xs p-3 rounded-xl border border-red-500/30">{erroProtocolo}</div>}
            
            {resultadoProtocolo && (
              <div className="bg-white/10 p-4 rounded-xl border border-white/20 animate-in fade-in">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Status do Pedido:</span>
                <span className={`inline-block px-2 py-1 rounded text-xs font-black uppercase tracking-widest mb-3 ${resultadoProtocolo.status === 'RESPONDIDO' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                  {resultadoProtocolo.status || 'EM ANÁLISE'}
                </span>
                
                {/* Ajustado: Utilizando 'resposta' ao invés de 'respostaOuvidoria' conforme o DTO do Back-end */}
                {resultadoProtocolo.resposta && (
                  <>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Resposta da Ouvidoria:</span>
                    <p className="text-xs text-slate-200 bg-black/20 p-3 rounded-lg leading-relaxed">{resultadoProtocolo.resposta}</p>
                  </>
                )}
                {resultadoProtocolo.urlAnexo && (
                   <a href={resultadoProtocolo.urlAnexo} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[10px] font-black text-blue-300 hover:text-white uppercase tracking-widest underline">
                     Ver Anexo Disponibilizado
                   </a>
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
            {satisfacaoEnviada ? (
              <div className="py-4 animate-in fade-in">
                <CheckCircle className="mx-auto text-emerald-500 mb-2" size={32} />
                <h3 className="font-black text-slate-800">Avaliação Registrada!</h3>
                <p className="text-xs text-slate-500 mt-1">Obrigado por nos ajudar a melhorar o portal.</p>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Avalie nosso Portal</h3>
                <p className="text-xs text-slate-500 mb-4">Sua opinião é fundamental para melhorarmos a transparência.</p>
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} type="button"
                      onClick={() => setSatisfacao({ ...satisfacao, nota: star })}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star size={28} className={satisfacao.nota >= star ? "fill-[var(--cor-primaria)] text-[var(--cor-primaria)]" : "text-slate-300"} />
                    </button>
                  ))}
                </div>
                <textarea 
                  rows={2} placeholder="Deixe um comentário (opcional)..."
                  value={satisfacao.comentario} onChange={(e) => setSatisfacao({...satisfacao, comentario: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[var(--cor-primaria)] focus:ring-1 resize-none mb-3"
                />
                <button 
                  type="button" onClick={handleEnviarSatisfacao} disabled={enviandoSatisfacao || satisfacao.nota === 0}
                  className="w-full bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-600 font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-colors disabled:opacity-50 mb-4"
                >
                  {enviandoSatisfacao ? 'Enviando...' : 'Enviar Avaliação'}
                </button>

                <div className="border-t border-slate-100 pt-4 mt-2">
                  <Link href="/sic/resultados" className="text-[10px] font-black text-[var(--cor-primaria)] uppercase tracking-widest hover:underline flex items-center justify-center gap-1">
                    <BarChart3 size={12} /> Ver Resultados do SIC
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* LADO DIREITO: e-SIC ONLINE */}
        <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Solicitação Eletrônica (e-SIC)</h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">Preencha o formulário abaixo para registrar sua demanda sem sair de casa.</p>
          </div>

          {protocoloGerado ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-10 text-center animate-in zoom-in-95">
              <div className="bg-emerald-100 text-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={40} />
              </div>
              <h3 className="text-2xl font-black text-emerald-800 tracking-tight mb-2">Solicitação Registrada!</h3>
              <p className="text-emerald-600 text-sm font-medium mb-8">
                Sua demanda foi enviada com sucesso para a nossa ouvidoria. O número do seu protocolo é: <br/>
                <strong className="text-emerald-900 text-xl tracking-widest block mt-3">{protocoloGerado}</strong>
              </p>
              <button 
                type="button" onClick={() => setProtocoloGerado(null)}
                className="bg-emerald-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors"
              >
                Fazer Nova Solicitação
              </button>
            </div>
          ) : (
            <form onSubmit={handleEnviarSolicitacao} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input 
                    required type="text" placeholder="Seu nome..."
                    value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[var(--cor-primaria)] focus:ring-1 focus:ring-[var(--cor-primaria)] transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail para Retorno</label>
                  <input 
                    required type="email" placeholder="seu@email.com"
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[var(--cor-primaria)] focus:ring-1 focus:ring-[var(--cor-primaria)] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">CPF ou CNPJ</label>
                  <input 
                    required type="text" placeholder="Apenas números..."
                    value={formData.documento} onChange={e => setFormData({...formData, documento: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[var(--cor-primaria)] focus:ring-1 focus:ring-[var(--cor-primaria)] transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo / Assunto</label>
                  <select 
                    required value={formData.tipoSolicitacao} onChange={e => setFormData({...formData, tipoSolicitacao: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[var(--cor-primaria)] focus:ring-1 focus:ring-[var(--cor-primaria)] transition-all"
                  >
                    <option value="" disabled>Selecione uma opção...</option>
                    <option value="Informacao">Pedido de Informação (LAI)</option>
                    <option value="Denuncia">Denúncia</option>
                    <option value="Reclamacao">Reclamação de Serviço</option>
                    <option value="Sugestao">Sugestão</option>
                    <option value="Elogio">Elogio</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mensagem (Detalhe o seu pedido)</label>
                <textarea 
                  required rows={5} placeholder="Escreva aqui os detalhes da sua solicitação..."
                  value={formData.mensagem} onChange={e => setFormData({...formData, mensagem: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-[var(--cor-primaria)] focus:ring-1 focus:ring-[var(--cor-primaria)] transition-all resize-none"
                />
              </div>

              <div className="flex items-start gap-3 bg-rose-50 p-4 rounded-xl border border-rose-100">
                <input 
                  type="checkbox" id="sigilo"
                  checked={formData.sigilo} onChange={e => setFormData({...formData, sigilo: e.target.checked})}
                  className="mt-1 shrink-0 accent-[var(--cor-primaria)] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="sigilo" className="text-xs font-medium text-rose-800 cursor-pointer leading-relaxed">
                  <strong>Desejo manter sigilo sobre meus dados pessoais.</strong> A lei garante a proteção de sua identidade caso a exposição possa trazer riscos ou retaliações (Art. 10, § 7º da Lei 13.460).
                </label>
              </div>

              <button 
                type="submit" disabled={enviando}
                className="w-full bg-slate-900 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--cor-primaria)] transition-colors disabled:opacity-70"
              >
                {enviando ? 'Enviando Protocolo...' : ( <><Send size={18} /> Enviar Solicitação Oficial</> )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-slate-50 text-slate-400 p-3 rounded-xl shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm font-bold text-slate-800 leading-tight">{value}</p>
      </div>
    </div>
  );
}