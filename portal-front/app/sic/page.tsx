'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Home, ChevronRight, MapPin, Clock, Phone, Mail, 
  Send, ShieldCheck, FileText, MessageSquare, Star, Search, CheckCircle, BarChart3, Paperclip, Download
} from 'lucide-react';
import axios from 'axios'; // Importação do axios puro para evitar o envio de tokens expirados
import { sicService, SicSolicitacaoRequestDTO, SicSolicitacaoResponseDTO } from '../../services/sicService';
import { satisfacaoService } from '../../services/satisfacaoService';
import api from '../../services/api';

// Função auxiliar para máscara de CPF/CNPJ
const mascaraDocumento = (valor: string) => {
  const v = valor.replace(/\D/g, '');
  if (v.length <= 11) {
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4').replace(/(-\d{2})\d+?$/, '$1');
  }
  return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, '$1.$2.$3/$4-$5').replace(/(-\d{2})\d+?$/, '$1');
};

export default function SicOuvidoriaPage() {
  const [formData, setFormData] = useState<SicSolicitacaoRequestDTO>({
    nome: '', documento: '', email: '', tipoSolicitacao: '', mensagem: '', sigilo: false, urlAnexoSolicitacao: ''
  });
  const [enviando, setEnviando] = useState(false);
  const [fazendoUpload, setFazendoUpload] = useState(false);
  const [protocoloGerado, setProtocoloGerado] = useState<string | null>(null);

  const [protocoloBusca, setProtocoloBusca] = useState('');
  const [documentoBusca, setDocumentoBusca] = useState('');
  const [buscandoProtocolo, setBuscandoProtocolo] = useState(false);
  const [resultadoProtocolo, setResultadoProtocolo] = useState<any | null>(null);

  const [satisfacao, setSatisfacao] = useState({ nota: 0, comentario: '' });
  const [enviandoSatisfacao, setEnviandoSatisfacao] = useState(false);
  const [satisfacaoEnviada, setSatisfacaoEnviada] = useState(false);

  // Captura a URL base dinamicamente para usar tanto no UPLOAD quanto no DOWNLOAD
  const baseUrl = api.defaults.baseURL || 'http://localhost:8080/api/v1';

  // Função para garantir que a URL de download bata no @GetMapping do Controller
  const gerarUrlArquivo = (caminhoOuNome: string) => {
    const urlLimpa = caminhoOuNome.trim();
    if (urlLimpa.startsWith('http')) return urlLimpa;
    // Aponta para a rota GET /api/v1/portal/arquivos/{nomeArquivo}
    return `${baseUrl}/portal/arquivos/${urlLimpa}`;
  };

  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, documento: mascaraDocumento(e.target.value) });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setFazendoUpload(true);
    const toastId = toast.loading('Enviando arquivo(s)...');
    
    try {
      const uploadPromises = files.map(async (file) => {
        const formDataFile = new FormData();
        formDataFile.append('file', file);
        
        // Utiliza o AXIOS PURO para ignorar o interceptor do frontend (evita o Erro 403)
        // Batendo na rota @PostMapping("/upload")
        const response = await axios.post(`${baseUrl}/portal/arquivos/upload`, formDataFile);
        
        return response.data.url;
      });

      const novasUrls = await Promise.all(uploadPromises);
      
      const urlsExistentes = formData.urlAnexoSolicitacao ? formData.urlAnexoSolicitacao.split(',') : [];
      const todasUrls = [...urlsExistentes, ...novasUrls].filter(Boolean).join(',');

      setFormData({ ...formData, urlAnexoSolicitacao: todasUrls });
      toast.success(`${files.length} arquivo(s) anexado(s) com sucesso!`, { id: toastId });
    } catch (error: any) {
      console.error("Erro detalhado no Upload:", error);
      toast.error('Erro ao enviar o(s) arquivo(s). Verifique o tamanho do documento.', { id: toastId });
    } finally {
      setFazendoUpload(false);
      e.target.value = ''; // Limpa o input
    }
  };

  const handleLimparAnexos = () => {
    setFormData({ ...formData, urlAnexoSolicitacao: '' });
  };

  const handleEnviarSolicitacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    const toastId = toast.loading('Registrando solicitação...');
    
    try {
      const payloadEnvio = { ...formData, documento: formData.documento.replace(/\D/g, '') };
      const response = await sicService.criarSolicitacao(payloadEnvio);
      setProtocoloGerado(response.protocolo);
      toast.success('Solicitação registrada com sucesso!', { id: toastId });
      setFormData({ nome: '', documento: '', email: '', tipoSolicitacao: '', mensagem: '', sigilo: false, urlAnexoSolicitacao: '' });
    } catch (error) {
      toast.error('Erro ao enviar solicitação. Verifique os dados.', { id: toastId });
    } finally {
      setEnviando(false);
    }
  };

  const handleConsultarProtocolo = async () => {
    if (!protocoloBusca.trim() || !documentoBusca.trim()) {
      toast.error('Informe o protocolo e o documento.');
      return;
    }
    
    setBuscandoProtocolo(true);
    setResultadoProtocolo(null);
    setSatisfacaoEnviada(false);
    setSatisfacao({ nota: 0, comentario: '' });

    try {
      const docLimpo = documentoBusca.replace(/\D/g, '');
      const response = await sicService.consultarProtocolo(protocoloBusca, docLimpo);
      setResultadoProtocolo(response);
      toast.success('Protocolo encontrado!');
    } catch (error: any) {
      toast.error(error.response?.status === 404 ? 'Protocolo não encontrado.' : 'Acesso negado ou erro no servidor.');
    } finally {
      setBuscandoProtocolo(false);
    }
  };

  const handleEnviarSatisfacao = async () => {
    if (satisfacao.nota === 0) return toast.error('Por favor, selecione uma nota de 1 a 5 estrelas.');
    setEnviandoSatisfacao(true);
    try {
      const payloadSatisfacao = {
        nota: satisfacao.nota,
        comentario: satisfacao.comentario,
        // CORRIGIDO AQUI: Alterado de 'ESIC' para 'SIC' para alinhar com o Backend
        moduloAvaliado: 'SIC' as 'SIC'
      };

      await satisfacaoService.registrarAvaliacao(payloadSatisfacao);
      setSatisfacaoEnviada(true);
    } catch (error) {
      toast.error("Erro ao registrar avaliação.");
    } finally {
      setEnviandoSatisfacao(false);
    }
  };

  const qtdAnexosForm = formData.urlAnexoSolicitacao ? formData.urlAnexoSolicitacao.split(',').length : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans animate-in fade-in duration-500">
      <Toaster position="top-right" />
      
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

          {/* Box de Acompanhamento */}
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
                  value={documentoBusca} onChange={(e) => setDocumentoBusca(mascaraDocumento(e.target.value))}
                  maxLength={18}
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

            {/* Resultado da Busca */}
            {resultadoProtocolo && (
              <div className="bg-white/10 p-5 rounded-2xl border border-white/20 animate-in fade-in mt-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status Atual:</span>
                <span className={`inline-block px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest mb-4 ${resultadoProtocolo.status === 'RESPONDIDO' ? 'bg-emerald-500/20 text-emerald-300' : resultadoProtocolo.status === 'NEGADO' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                  {resultadoProtocolo.status || 'EM ANÁLISE'}
                </span>

                {resultadoProtocolo.urlAnexoSolicitacao && (
                  <div className="mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Seus Anexos:</span>
                    <div className="flex flex-wrap gap-2">
                      {resultadoProtocolo.urlAnexoSolicitacao.split(',').map((url: string, index: number) => (
                        <a key={index} href={gerarUrlArquivo(url)} target="_blank" rel="noreferrer" 
                           className="flex items-center gap-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                          <Paperclip size={12} /> Anexo {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                {resultadoProtocolo.respostaOficial && (
                  <div className="mb-4 pt-4 border-t border-white/10">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Resposta da Ouvidoria:</span>
                    <p className="text-xs text-slate-200 bg-black/30 p-4 rounded-xl leading-relaxed">{resultadoProtocolo.respostaOficial}</p>
                  </div>
                )}

                {resultadoProtocolo.urlAnexoResposta && (
                  <div className="mb-4 space-y-2">
                    {resultadoProtocolo.urlAnexoResposta.split(',').map((url: string, index: number) => (
                      <a key={index} href={gerarUrlArquivo(url)} target="_blank" rel="noreferrer" 
                         className="flex items-center justify-center gap-2 bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white transition-colors p-3 rounded-xl text-[10px] font-black uppercase tracking-widest w-full">
                        <Download size={16} /> Baixar Resposta Oficial ({index + 1})
                      </a>
                    ))}
                  </div>
                )}

                {resultadoProtocolo.tramites && resultadoProtocolo.tramites.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4 flex items-center gap-2">
                      <Clock size={12} /> Histórico de Trâmites:
                    </span>
                    <div className="border-l-2 border-[var(--cor-primaria)]/50 pl-4 ml-2 space-y-5">
                      {resultadoProtocolo.tramites.map((tramite: any, idx: number) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[23px] top-1 w-3 h-3 bg-[var(--cor-primaria)] rounded-full border-2 border-slate-900"></div>
                          <p className="text-xs font-bold text-slate-300">
                            {new Date(tramite.dataTramite).toLocaleDateString('pt-BR')} às {new Date(tramite.dataTramite).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--cor-primaria)] mt-0.5">{tramite.status}</p>
                          {tramite.observacao && <p className="text-xs text-slate-400 mt-1 italic">"{tramite.observacao}"</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Box de Avaliação */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
            {satisfacaoEnviada ? (
              <div className="py-4 animate-in fade-in">
                <CheckCircle className="mx-auto text-emerald-500 mb-2" size={32} />
                <h3 className="font-black text-slate-800">Avaliação Registrada!</h3>
                <p className="text-xs text-slate-500 mt-1">Obrigado por nos ajudar a melhorar o portal.</p>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Avalie nosso Atendimento</h3>
                
                {resultadoProtocolo && (resultadoProtocolo.status === 'RESPONDIDO' || resultadoProtocolo.status === 'NEGADO') ? (
                  <div className="animate-in fade-in duration-500">
                    <p className="text-xs text-slate-500 mb-4">Sua opinião sobre este protocolo é fundamental.</p>
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
                      className="w-full bg-[var(--cor-primaria)] text-white hover:opacity-90 font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-colors disabled:opacity-50 mb-4"
                    >
                      {enviandoSatisfacao ? 'Enviando...' : 'Enviar Avaliação'}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    Consulte acima um protocolo que já esteja <strong>Respondido</strong> para desbloquear a avaliação do serviço.
                  </p>
                )}

                <div className="border-t border-slate-100 pt-4 mt-2">
                  <Link href="/sic/resultados" className="text-[10px] font-black text-slate-600 hover:text-[var(--cor-primaria)] uppercase tracking-widest flex items-center justify-center gap-1">
                    <BarChart3 size={12} /> Ver Relatório Estatístico do SIC
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
                Guarde este número para consultar o andamento da sua solicitação: <br/>
                <strong className="text-emerald-900 text-3xl tracking-widest block mt-4 bg-white p-4 rounded-xl border border-emerald-200 shadow-sm">{protocoloGerado}</strong>
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
                    maxLength={18}
                    value={formData.documento} onChange={handleDocumentoChange}
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
                    <option value="INFORMACAO">Pedido de Informação (LAI)</option>
                    <option value="DENUNCIA">Denúncia</option>
                    <option value="RECLAMACAO">Reclamação de Serviço</option>
                    <option value="SUGESTAO">Sugestão</option>
                    <option value="ELOGIO">Elogio</option>
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

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Anexar Documento(s)</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <input 
                    type="file" id="file-upload" className="hidden"
                    multiple
                    onChange={handleFileUpload} disabled={fazendoUpload}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <label 
                    htmlFor="file-upload" 
                    className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border border-slate-200 w-fit"
                  >
                    <Paperclip size={16} /> {fazendoUpload ? 'Enviando...' : 'Escolher Arquivos'}
                  </label>
                  
                  {qtdAnexosForm > 0 && !fazendoUpload && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle size={14}/> {qtdAnexosForm} arquivo(s) anexado(s)
                      </span>
                      <button 
                        type="button" onClick={handleLimparAnexos}
                        className="text-[10px] text-rose-500 hover:underline font-bold uppercase tracking-widest"
                      >
                        Limpar
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-medium ml-1">Você pode selecionar mais de um arquivo ao mesmo tempo.</p>
              </div>

              <div className="flex items-start gap-3 bg-rose-50 p-4 rounded-xl border border-rose-100">
                <input 
                  type="checkbox" id="sigilo"
                  checked={formData.sigilo} onChange={e => setFormData({...formData, sigilo: e.target.checked})}
                  className="mt-1 shrink-0 accent-[var(--cor-primaria)] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="sigilo" className="text-xs font-medium text-rose-800 cursor-pointer leading-relaxed">
                  <strong>Desejo manter sigilo sobre meus dados pessoais.</strong> A lei garante a proteção da sua identidade caso a exposição possa trazer riscos ou retaliações (Art. 10, § 7º da Lei 13.460).
                </label>
              </div>

              <button 
                type="submit" disabled={enviando || fazendoUpload}
                className="w-full bg-slate-900 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--cor-primaria)] transition-colors disabled:opacity-70"
              >
                {enviando ? 'Processando...' : ( <><Send size={18} /> Protocolar Solicitação Oficial</> )}
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
      <div className="bg-slate-50 text-[var(--cor-primaria)] p-3 rounded-xl shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm font-bold text-slate-800 leading-tight">{value}</p>
      </div>
    </div>
  );
}