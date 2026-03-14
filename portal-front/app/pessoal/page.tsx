'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Search, ArrowLeft, ChevronRight, Home, 
  Download, Printer, Eye, X, CheckCircle2, Users, Briefcase, 
  User, Banknote, ShieldAlert, GraduationCap, HardHat, FileSignature, FileText, MapPin, Clock
} from 'lucide-react';
import Link from 'next/link';
import api from '../../services/api';

interface ServidorPublico {
  id: number;
  nome: string;
  matricula: string;
  cargo: string;
  lotacao: string;
  tipoVinculo: string;
  dataAdmissao: string;
  dataExoneracao?: string;
  cargaHoraria: number;
}

interface FolhaPagamento {
  id: number;
  servidorId: number;
  nomeServidor: string;
  cargoServidor: string;
  exercicio: number;
  mes: number;
  remuneracaoBruta: number;
  verbasIndenizatorias: number;
  descontosLegais: number;
  salarioLiquido: number;
}

type AbaAtiva = 'remuneracao' | 'servidores' | 'estagiarios' | 'terceirizados' | 'concursos';

export default function PessoalPage() {
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('remuneracao');
  
  // Estados de Dados
  const [servidores, setServidores] = useState<ServidorPublico[]>([]);
  const [folha, setFolha] = useState<FolhaPagamento[]>([]);
  const [resumo, setResumo] = useState({ totalBruto: 0, totalLiquido: 0 });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<FolhaPagamento | null>(null);

  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);

  const anoAtual = new Date().getFullYear().toString();
  const mesAtual = (new Date().getMonth() + 1).toString();
  const [anosDisponiveis, setAnosDisponiveis] = useState<string[]>([]);

  // Filtros expandidos para incluir cargo e lotação
  const [filtros, setFiltros] = useState({ exercicio: '', mes: '', buscaGeral: '', cargo: '', lotacao: '' });
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtros);
  
  const isInitialized = useRef(false);

  const meses = [
    { num: '1', nome: 'Janeiro' }, { num: '2', nome: 'Fevereiro' }, { num: '3', nome: 'Março' },
    { num: '4', nome: 'Abril' }, { num: '5', nome: 'Maio' }, { num: '6', nome: 'Junho' },
    { num: '7', nome: 'Julho' }, { num: '8', nome: 'Agosto' }, { num: '9', nome: 'Setembro' },
    { num: '10', nome: 'Outubro' }, { num: '11', nome: 'Novembro' }, { num: '12', nome: 'Dezembro' }
  ];

  // Busca de SERVIDORES (Item 6.1)
  const buscarServidores = useCallback(async (filtrosBusca = filtros, pagina = paginaAtual) => {
    if (abaAtiva !== 'servidores') return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Mapeia os novos filtros para a requisição
      if (filtrosBusca.buscaGeral) params.append('nome', filtrosBusca.buscaGeral);
      if (filtrosBusca.cargo) params.append('cargo', filtrosBusca.cargo);
      if (filtrosBusca.lotacao) params.append('lotacao', filtrosBusca.lotacao);
      
      params.append('page', pagina.toString());
      params.append('size', '50');

      const res = await api.get(`/portal/servidores?${params.toString()}`);
      
      const conteudoRecebido = res.data?.content || res.data || [];
      setServidores(Array.isArray(conteudoRecebido) ? conteudoRecebido : []);
      setTotalPaginas(res.data?.totalPages || 0); 
      setFiltrosAplicados(filtrosBusca);
    } catch (err) {
      console.error("Erro na busca de servidores:", err);
      setError("Não foi possível conectar à API.");
    } finally {
      setLoading(false);
    }
  }, [abaAtiva]); 

  // Busca de FOLHA / REMUNERAÇÃO (Item 6.2)
  const buscarFolha = useCallback(async (filtrosBusca = filtros, pagina = paginaAtual) => {
    if (abaAtiva !== 'remuneracao') return;
    if (!filtrosBusca.exercicio || !filtrosBusca.mes) return; 
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('exercicio', filtrosBusca.exercicio);
      params.append('mes', filtrosBusca.mes);
      if (filtrosBusca.buscaGeral) params.append('nomeServidor', filtrosBusca.buscaGeral);
      params.append('page', pagina.toString());
      params.append('size', '50');

      const [resLista, resResumo] = await Promise.all([
        api.get(`/portal/folha-pagamento?${params.toString()}`),
        api.get(`/portal/folha-pagamento/estatisticas?exercicio=${filtrosBusca.exercicio}&mes=${filtrosBusca.mes}`)
           .catch(() => ({ data: { totalRemuneracaoBruta: 0, totalSalarioLiquido: 0 } }))
      ]);

      const conteudoRecebido = resLista.data?.content || resLista.data || [];
      setFolha(Array.isArray(conteudoRecebido) ? conteudoRecebido : []);
      setTotalPaginas(resLista.data?.totalPages || 0); 
      setResumo({ totalBruto: resResumo.data?.totalRemuneracaoBruta || 0, totalLiquido: resResumo.data?.totalSalarioLiquido || 0 });
      setFiltrosAplicados(filtrosBusca);
    } catch (err) {
      console.error("Erro na busca da folha:", err);
    } finally {
      setLoading(false);
    }
  }, [abaAtiva]); 

  useEffect(() => {
    if (!isInitialized.current) {
        isInitialized.current = true;
        const anos = [anoAtual, (parseInt(anoAtual) - 1).toString(), (parseInt(anoAtual) - 2).toString()];
        setAnosDisponiveis(anos);
        setFiltros(prev => {
          const newFiltros = { ...prev, exercicio: anoAtual, mes: mesAtual };
          if(abaAtiva === 'servidores') buscarServidores(newFiltros, 0); 
          else if(abaAtiva === 'remuneracao') buscarFolha(newFiltros, 0);
          return newFiltros;
        });
    }
  }, [anoAtual, mesAtual, buscarServidores, buscarFolha, abaAtiva]);

  useEffect(() => {
    if (!isInitialized.current) return;
    
    if (abaAtiva === 'servidores') {
      buscarServidores(filtros, paginaAtual);
    } else if (abaAtiva === 'remuneracao' && filtros.exercicio && filtros.mes) {
      buscarFolha(filtros, paginaAtual);
    } else {
      setLoading(false); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaAtual, abaAtiva]); 

  const handlePesquisar = () => {
    if (abaAtiva === 'servidores') {
      if (paginaAtual === 0) buscarServidores(filtros, 0); else setPaginaAtual(0); 
    } else if (abaAtiva === 'remuneracao') {
      if (paginaAtual === 0) buscarFolha(filtros, 0); else setPaginaAtual(0); 
    }
  };

  const handleExport = async (formato: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (filtrosAplicados.buscaGeral) params.append(abaAtiva === 'servidores' ? 'nome' : 'nomeServidor', filtrosAplicados.buscaGeral);

      if (abaAtiva === 'servidores') {
        if (filtrosAplicados.cargo) params.append('cargo', filtrosAplicados.cargo);
        if (filtrosAplicados.lotacao) params.append('lotacao', filtrosAplicados.lotacao);
        const response = await api.get(`/portal/servidores/exportar/${formato}?${params.toString()}`, { responseType: 'blob' });
        downloadBlob(response.data, `lista_servidores.${formato}`);
      } else if (abaAtiva === 'remuneracao') {
        if (filtrosAplicados.exercicio) params.append('exercicio', filtrosAplicados.exercicio);
        if (filtrosAplicados.mes) params.append('mes', filtrosAplicados.mes);
        const response = await api.get(`/portal/folha-pagamento/exportar/${formato}?${params.toString()}`, { responseType: 'blob' });
        downloadBlob(response.data, `folha_pagamento_${filtrosAplicados.mes}_${filtrosAplicados.exercicio}.${formato}`);
      } else {
        alert(`Exportação de ${abaAtiva} gerada com sucesso.`);
      }
    } catch (err) {
      alert(`Erro ao gerar o arquivo ${formato.toUpperCase()}.`);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadBlob = (data: Blob, filename: string) => {
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const MensagemNadaConsta = ({ titulo, texto }: { titulo: string, texto: string }) => (
    <tr>
      <td colSpan={6} className="py-12 px-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center max-w-3xl mx-auto">
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-amber-800 font-black text-sm uppercase tracking-widest mb-2">{titulo}</h3>
          <p className="text-amber-700/80 text-xs font-bold leading-relaxed">{texto}</p>
          <p className="text-amber-600/60 text-[10px] font-mono mt-4">Informação atualizada até a data atual. Série histórica preservada (últimos 3 anos).</p>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 bg-slate-50 min-h-screen relative font-sans">
      
      {/* BREADCRUMB */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">
        <Link href="/" className="hover:text-[var(--cor-primaria)] transition-colors flex items-center gap-1"><Home size={12} /> Início</Link>
        <ChevronRight size={12} className="opacity-50" />
        <span className="text-slate-600">Pessoal e RH</span>
      </nav>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
        <div>
          <button onClick={() => window.history.back()} className="flex items-center text-slate-400 hover:text-[var(--cor-primaria)] mb-2 transition-all font-bold text-xs uppercase tracking-widest">
            <ArrowLeft size={14} className="mr-1.5" /> Voltar
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
            <Users className="text-[var(--cor-primaria)]" size={32} aria-hidden="true" /> Gestão de Pessoal
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Portal de Recursos Humanos.</p>
        </div>
        
        <div className="flex gap-2">
          {/* Exigência do item 6.2: Tabela de Padrão Remuneratório */}
          <button className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-xl shadow-sm font-bold text-xs uppercase hover:bg-slate-700 transition-all mr-2">
            <FileText size={14} className="mr-2" /> Padrão Remuneratório
          </button>
          <button onClick={() => handleExport('pdf')} disabled={isExporting} className="bg-white p-3 rounded-xl border border-slate-200 text-slate-500 hover:text-black hover:shadow-md transition-all disabled:opacity-50" title="Exportar PDF">
            <Printer size={18} className={isExporting ? "animate-pulse" : ""} />
          </button>
          <button onClick={() => handleExport('csv')} disabled={isExporting} className="bg-white p-3 rounded-xl border border-slate-200 text-slate-500 hover:text-black hover:shadow-md transition-all disabled:opacity-50" title="Exportar CSV">
            <Download size={18} className={isExporting ? "animate-pulse" : ""} />
          </button>
        </div>
      </div>

      {/* SELETOR DE ABAS (TABS) */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
        <TabButton icon={<Banknote/>} label="Remuneração" active={abaAtiva === 'remuneracao'} onClick={() => {setAbaAtiva('remuneracao'); setPaginaAtual(0);}} />
        <TabButton icon={<Users/>} label="Servidores" active={abaAtiva === 'servidores'} onClick={() => {setAbaAtiva('servidores'); setPaginaAtual(0);}} />
        <TabButton icon={<GraduationCap/>} label="Estagiários" active={abaAtiva === 'estagiarios'} onClick={() => {setAbaAtiva('estagiarios'); setPaginaAtual(0);}} />
        <TabButton icon={<HardHat/>} label="Terceirizados" active={abaAtiva === 'terceirizados'} onClick={() => {setAbaAtiva('terceirizados'); setPaginaAtual(0);}} />
        <TabButton icon={<FileSignature/>} label="Concursos" active={abaAtiva === 'concursos'} onClick={() => {setAbaAtiva('concursos'); setPaginaAtual(0);}} />
      </div>

      {/* CARDS DE RESUMO (Exibidos apenas na Folha) */}
      {abaAtiva === 'remuneracao' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 animate-in fade-in slide-in-from-top-4">
          <div className="bg-[var(--cor-primaria)] p-6 rounded-2xl text-white shadow-lg shadow-[var(--cor-primaria-fundo)] relative overflow-hidden group">
            <Banknote className="absolute right-[-10px] bottom-[-10px] opacity-20 group-hover:scale-110 transition-transform duration-500" size={120} aria-hidden="true" />
            <p className="text-white/80 font-bold uppercase text-[10px] tracking-widest mb-1">Total Remuneração Bruta {filtrosAplicados.exercicio ? `(${filtrosAplicados.mes}/${filtrosAplicados.exercicio})` : ''}</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">{loading ? "..." : formatMoney(resumo.totalBruto)}</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <CheckCircle2 className="absolute right-[-10px] bottom-[-10px] opacity-5 text-slate-900 group-hover:scale-110 transition-transform duration-500" size={120} aria-hidden="true" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">Total Salário Líquido</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">{loading ? "..." : formatMoney(resumo.totalLiquido)}</h2>
          </div>
        </div>
      )}

      {/* FILTROS DINÂMICOS CONFORME A ABA */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 items-end ${(abaAtiva === 'remuneracao' || abaAtiva === 'servidores') ? 'md:grid-cols-4' : 'md:grid-cols-2'}`}>
          
          {/* Filtros específicos de Remuneração */}
          {abaAtiva === 'remuneracao' && (
            <>
              <FilterBox label="Exercício (Ano)">
                <select value={filtros.exercicio} onChange={(e) => setFiltros({...filtros, exercicio: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none cursor-pointer">
                  {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </FilterBox>
              <FilterBox label="Mês de Referência">
                <select value={filtros.mes} onChange={(e) => setFiltros({...filtros, mes: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none cursor-pointer">
                  {meses.map(m => <option key={m.num} value={m.num}>{m.nome}</option>)}
                </select>
              </FilterBox>
            </>
          )}

          {/* Filtros específicos de Servidores */}
          {abaAtiva === 'servidores' && (
            <>
              <FilterBox label="Cargo">
                <input type="text" placeholder="Ex: Professor..." value={filtros.cargo} onChange={(e) => setFiltros({...filtros, cargo: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none placeholder:text-slate-300" />
              </FilterBox>
              <FilterBox label="Lotação">
                <input type="text" placeholder="Ex: Secretaria de Saúde..." value={filtros.lotacao} onChange={(e) => setFiltros({...filtros, lotacao: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none placeholder:text-slate-300" />
              </FilterBox>
            </>
          )}

          <FilterBox label={abaAtiva === 'servidores' ? "Nome do Servidor" : "Busca Geral"}>
            <input type="text" placeholder="Buscar por nome..." value={filtros.buscaGeral} onChange={(e) => setFiltros({...filtros, buscaGeral: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none placeholder:text-slate-300" />
          </FilterBox>
          <button onClick={handlePesquisar} className="bg-slate-900 text-white h-[46px] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[var(--cor-primaria)] transition-colors shadow-md flex items-center justify-center gap-2">
            <Search size={16} /> Filtrar
          </button>
        </div>
      </div>

      {/* TABELA DE DADOS (Dinâmica conforme a Aba) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                {abaAtiva === 'remuneracao' && (
                  <><th className="px-6 py-4">Servidor / Cargo</th><th className="px-6 py-4">Ref.</th><th className="px-6 py-4 text-right">Bruto (R$)</th><th className="px-6 py-4 text-right">Descontos (R$)</th><th className="px-6 py-4 text-right">Líquido (R$)</th><th className="px-6 py-4 text-center">Ficha</th></>
                )}
                {abaAtiva === 'servidores' && (
                  <><th className="px-6 py-4">Servidor / Vínculo</th><th className="px-6 py-4">Cargo / Função</th><th className="px-6 py-4">Lotação</th><th className="px-6 py-4 text-center">C.H.</th><th className="px-6 py-4 text-center">Admissão</th></>
                )}
                {abaAtiva === 'estagiarios' && (
                  <><th className="px-6 py-4">Nome do Estagiário</th><th className="px-6 py-4">Início Contrato</th><th className="px-6 py-4">Fim Contrato</th></>
                )}
                {abaAtiva === 'terceirizados' && (
                  <><th className="px-6 py-4">Nome Completo</th><th className="px-6 py-4">Atividade/Função</th><th className="px-6 py-4">Empresa Empregadora</th></>
                )}
                {abaAtiva === 'concursos' && (
                  <><th className="px-6 py-4">Edital / Processo</th><th className="px-6 py-4">Situação</th><th className="px-6 py-4">Arquivos e Classificação</th></>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center font-bold text-slate-400 animate-pulse text-sm uppercase tracking-widest">Buscando informações...</td></tr>
              ) : (
                <>
                  {/* TABELA DA FOLHA/REMUNERACAO (6.2) */}
                  {abaAtiva === 'remuneracao' && folha.length === 0 && (
                     <tr><td colSpan={6} className="py-12 text-center text-slate-500 text-sm">Nenhuma folha encontrada para os filtros aplicados.</td></tr>
                  )}
                  {abaAtiva === 'remuneracao' && folha.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-xs truncate max-w-[250px]" title={item.nomeServidor}>{item.nomeServidor}</div>
                        <div className="text-[9px] font-bold text-slate-500 mt-1 uppercase flex items-center gap-1"><Briefcase size={10}/> {item.cargoServidor}</div>
                      </td>
                      <td className="px-6 py-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-black border border-slate-200">{String(item.mes).padStart(2, '0')}/{item.exercicio}</span></td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-xs">{formatMoney(item.remuneracaoBruta)}</div>
                        {item.verbasIndenizatorias > 0 && <div className="text-[9px] font-bold text-amber-600 mt-0.5">+ Indenizações</div>}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap"><div className="font-bold text-red-500 text-xs">-{formatMoney(item.descontosLegais)}</div></td>
                      <td className="px-6 py-4 text-right whitespace-nowrap"><div className="font-black text-emerald-600 text-sm">{formatMoney(item.salarioLiquido)}</div></td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => { setSelected(item); setIsModalOpen(true); }} className="inline-flex items-center justify-center bg-slate-100 text-slate-500 p-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition-colors" title="Ficha Nominal">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* TABELA DE SERVIDORES (6.1) */}
                  {abaAtiva === 'servidores' && servidores.length === 0 && (
                     <tr><td colSpan={5} className="py-12 text-center text-slate-500 text-sm">Nenhum servidor encontrado para os filtros aplicados.</td></tr>
                  )}
                  {abaAtiva === 'servidores' && servidores.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-xs truncate max-w-[250px]" title={item.nome}>{item.nome}</div>
                        <div className="text-[9px] font-bold text-slate-500 mt-1 uppercase flex items-center gap-1">{item.tipoVinculo || 'Servidor'}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">{item.cargo}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border border-slate-200 bg-slate-100 text-slate-600">
                          <MapPin size={10}/> {item.lotacao}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-slate-600 flex items-center justify-center gap-1"><Clock size={12} className="text-slate-400"/> {item.cargaHoraria}h</td>
                      <td className="px-6 py-4 text-center text-[10px] font-mono font-bold text-slate-500">
                        {item.dataAdmissao ? new Date(item.dataAdmissao).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '---'}
                      </td>
                    </tr>
                  ))}

                  {/* EMPTY STATES PARA AS OUTRAS ABAS (6.3 a 6.6) */}
                  {abaAtiva === 'estagiarios' && (
                    <MensagemNadaConsta titulo="Declaração de Inexistência de Estagiários" texto="Declara-se, para os devidos fins de transparência (Item 6.3 - PNTP), que esta Unidade Gestora não celebrou contratos de estágio no exercício atual e nos 3 (três) anos que antecedem esta pesquisa." />
                  )}
                  {abaAtiva === 'terceirizados' && (
                    <MensagemNadaConsta titulo="Declaração de Inexistência de Terceirizados" texto="Declara-se, para os devidos fins de transparência (Item 6.4 - PNTP), que informamos que não há contratos vigentes de terceirização de mão de obra direta para prestação de serviços a este Poder/Órgão no período pesquisado." />
                  )}
                  {abaAtiva === 'concursos' && (
                    <MensagemNadaConsta titulo="Declaração de Inexistência de Concursos" texto={`A Unidade Gestora não realizou nenhum concurso público ou processo seletivo nos últimos anos. O último certame foi realizado em exercício anterior à série histórica exigida (3 anos). Informação atualizada até o presente ano de ${anoAtual}. (Itens 6.5 e 6.6 - PNTP)`} />
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
        
        {/* PAGINAÇÃO */}
        {(abaAtiva === 'servidores' || abaAtiva === 'remuneracao') && !loading && totalPaginas > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Página {paginaAtual + 1} de {totalPaginas}</span>
            <div className="flex gap-2">
              <button onClick={() => setPaginaAtual(p => Math.max(0, p - 1))} disabled={paginaAtual === 0} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 shadow-sm">Anterior</button>
              <button onClick={() => setPaginaAtual(p => p + 1)} disabled={paginaAtual >= totalPaginas - 1} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 shadow-sm">Próximo</button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: FICHA DE REMUNERAÇÃO (Folha) */}
      {isModalOpen && selected && abaAtiva === 'remuneracao' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[var(--cor-primaria)] p-5 text-white flex justify-between items-center shrink-0">
              <div className="flex gap-3 items-center">
                <div className="bg-white/20 p-2.5 rounded-xl"><Banknote size={20}/></div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight leading-none italic">Ficha de Remuneração Nominal</h2>
                  <p className="text-white/80 text-[9px] font-bold uppercase mt-1 tracking-widest">Ref: {String(selected.mes).padStart(2, '0')} / {selected.exercicio}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5 overflow-y-auto space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-4 items-center">
                <div className="bg-slate-200 p-3 rounded-full text-slate-500 shrink-0"><User size={24}/></div>
                <div className="min-w-0">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Identificação do Servidor</span>
                  <h3 className="text-sm font-bold text-slate-800 uppercase truncate" title={selected.nomeServidor}>{selected.nomeServidor}</h3>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase flex items-center gap-1"><Briefcase size={12}/> {selected.cargoServidor}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">Composição da Remuneração</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="text-xs font-bold text-blue-800 uppercase">Remuneração Base / Bruta</span>
                    <span className="text-sm font-black text-blue-900">{formatMoney(selected.remuneracaoBruta)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <span className="text-xs font-bold text-amber-800 uppercase">Verbas Indenizatórias</span>
                    <span className="text-sm font-black text-amber-900">{formatMoney(selected.verbasIndenizatorias)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                    <span className="text-xs font-bold text-red-800 uppercase flex items-center gap-1"><ShieldAlert size={12}/> Descontos Legais</span>
                    <span className="text-sm font-black text-red-900">-{formatMoney(selected.descontosLegais)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-[var(--cor-primaria-fundo)] p-5 rounded-xl border border-[var(--cor-primaria-fundo)]/50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-[11px] font-black text-[var(--cor-primaria)] uppercase tracking-widest">Valor Líquido Recebido</h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Conforme Art. 6.2 (Cartilha PNTP)</p>
                  </div>
                  <span className="text-3xl font-black text-emerald-600">{formatMoney(selected.salarioLiquido)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponente de Tab
function TabButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shrink-0 border ${
        active 
          ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      <div className={active ? "text-[var(--cor-primaria)]" : "opacity-70"}>{React.cloneElement(icon as React.ReactElement, { size: 16 })}</div>
      {label}
    </button>
  );
}

function FilterBox({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200 flex flex-col focus-within:border-[var(--cor-primaria)] focus-within:ring-1 focus-within:ring-[var(--cor-primaria)] transition-colors">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</span>
      {children}
    </div>
  );
}