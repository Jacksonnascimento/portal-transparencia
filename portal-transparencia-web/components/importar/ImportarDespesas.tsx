'use client';

import { useState } from 'react';
import api from '@/services/api';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  FileType,
  Loader2,
  TrendingDown,
  FileCheck,
  X
} from 'lucide-react';

export function ImportarDespesas() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [inputKey, setInputKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // --- FUNÇÃO PARA LIMPAR TUDO ---
  const handleCancel = () => {
    setFile(null);
    setStatus({ type: null, message: '' });
    setInputKey(prev => prev + 1); // Reseta o input nativo
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setStatus({ type: null, message: '' });
    } else {
      setStatus({ type: 'error', message: 'Apenas ficheiros .csv são permitidos.' });
    }
  };

  const handleDownloadModel = () => {
    // LAYOUT PNTP: 22 Colunas Obrigatórias
    const header = "exercicio;numero_empenho;data_empenho;orgao_codigo;orgao_nome;unidade_codigo;unidade_nome;funcao;subfuncao;programa;acao_governo;elemento_despesa;fonte_recursos;credor_cpf_cnpj;credor_razao_social;valor_empenhado;valor_liquidado;data_liquidacao;valor_pago;data_pagamento;historico_objetivo;modalidade_licitacao";
    const example = "2025;2025/0001;15/01/2025;02;SECRETARIA DE EDUCACAO;0201;FUNDO DE EDUCACAO;12;361;0005;2010;339030;1500;12345678000190;EMPRESA FORNECEDORA LTDA;5000,00;5000,00;20/01/2025;5000,00;25/01/2025;AQUISICAO DE MATERIAL DIDATICO;PREGAO ELETRONICO 01/2025";
    const csvContent = `${header}\n${example}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'layout_despesas_padrao.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus({ type: null, message: '' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      // NOVA ROTA DE DESPESAS
      await api.post('/despesas/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus({ type: 'success', message: 'Importação processada com sucesso! Os dados já estão disponíveis.' });
      setFile(null); 
    } catch (error: any) {
      setStatus({ type: 'error', message: 'Falha na importação. Verifique se as 22 colunas e o separador (;) estão corretos.' });
    } finally {
      setLoading(false);
      setInputKey(prev => prev + 1);
    }
  };

  // LAYOUT DA CARTILHA PNTP
  const colunasCartilha = [
    { campo: 'exercicio', obr: 'Sim', desc: 'Ano de referência (ex: 2025)' },
    { campo: 'numero_empenho', obr: 'Sim', desc: 'Identificador do empenho' },
    { campo: 'data_empenho', obr: 'Sim', desc: 'Formato DD/MM/AAAA' },
    { campo: 'orgao_codigo', obr: 'Não', desc: 'Código do Órgão' },
    { campo: 'orgao_nome', obr: 'Não', desc: 'Nome do Órgão' },
    { campo: 'unidade_codigo', obr: 'Não', desc: 'Código da Unidade' },
    { campo: 'unidade_nome', obr: 'Não', desc: 'Nome da Unidade' },
    { campo: 'funcao', obr: 'Não', desc: 'Função Orçamentária' },
    { campo: 'subfuncao', obr: 'Não', desc: 'Subfunção Orçamentária' },
    { campo: 'programa', obr: 'Não', desc: 'Programa de Governo' },
    { campo: 'acao_governo', obr: 'Não', desc: 'Ação / Projeto / Atividade' },
    { campo: 'elemento_despesa', obr: 'Não', desc: 'Classificação da despesa (ex: 339030)' },
    { campo: 'fonte_recursos', obr: 'Não', desc: 'Fonte de custeio' },
    { campo: 'credor_cpf_cnpj', obr: 'Sim', desc: 'Somente números (11 ou 14 dígitos)' },
    { campo: 'credor_razao_social', obr: 'Sim', desc: 'Nome do fornecedor/favorecido' },
    { campo: 'valor_empenhado', obr: 'Sim', desc: 'Formato decimal com vírgula (ex: 1500,50)' },
    { campo: 'valor_liquidado', obr: 'Não', desc: 'Formato decimal com vírgula' },
    { campo: 'data_liquidacao', obr: 'Não', desc: 'Formato DD/MM/AAAA' },
    { campo: 'valor_pago', obr: 'Não', desc: 'Formato decimal com vírgula' },
    { campo: 'data_pagamento', obr: 'Não', desc: 'Formato DD/MM/AAAA' },
    { campo: 'historico_objetivo', obr: 'Não', desc: 'Finalidade da despesa' },
    { campo: 'modalidade_licitacao', obr: 'Não', desc: 'Ex: Pregão, Dispensa, Inexigibilidade' },
  ];

  return (
    <div 
      className="w-full relative"
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/10 backdrop-blur-sm border-4 border-dashed border-slate-400 rounded-2xl pointer-events-none transition-all">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce">
            <UploadCloud size={48} className="text-slate-900" />
            <span className="mt-4 font-black text-slate-900 uppercase text-sm tracking-widest">Solte o ficheiro CSV aqui</span>
          </div>
        </div>
      )}

      <div className="mb-8 border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-black text-white rounded-lg">
            <TrendingDown size={24} />
          </div>
          Carga de Despesas Públicas
        </h2>
        <p className="text-slate-500 text-sm mt-1 ml-12">Importação em lote de empenhos, liquidações e pagamentos via CSV.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LADO ESQUERDO: DOWNLOAD E UPLOAD */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-xs uppercase tracking-widest">
              <FileSpreadsheet size={16} className="text-slate-400" /> 1. Obter Layout
            </h3>
            <button 
              onClick={handleDownloadModel}
              className="w-full bg-slate-50 border border-slate-300 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wide"
            >
              <Download size={16} /> Baixar Modelo .CSV
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-xs uppercase tracking-widest">
              <UploadCloud size={16} className="text-slate-400" /> 2. Upload do Ficheiro
            </h3>
            
            <div className={`border-2 border-dashed rounded-xl p-8 text-center relative transition-all group ${file ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}>
              <input 
                key={inputKey}
                type="file" 
                accept=".csv" 
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) { setFile(selected); setStatus({ type: null, message: '' }); }
                }} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <FileType size={32} className={`mx-auto mb-3 transition-colors ${file ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <p className="text-xs font-bold text-slate-600 truncate px-2">
                {file ? file.name : "Clique ou arraste o CSV aqui"}
              </p>
            </div>

            {file && (
              <div className="mt-6 animate-in zoom-in-95 space-y-3">
                <div className="p-3 bg-emerald-100/50 rounded-lg flex items-center gap-2 text-emerald-800 font-bold text-xs border border-emerald-200">
                  <FileCheck size={16} /> Ficheiro pronto para carga
                </div>
                
                <button 
                  onClick={handleUpload}
                  disabled={loading}
                  className="w-full py-3 bg-black hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                  {loading ? "Processando..." : "Iniciar Importação"}
                </button>
                
                {/* BOTÃO DE CANCELAR REUTILIZADO */}
                <button 
                  onClick={handleCancel}
                  className="w-full py-2 text-slate-400 hover:text-red-600 text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1"
                >
                  <X size={12} /> Cancelar seleção
                </button>
              </div>
            )}

            {status.message && (
              <div className={`mt-4 p-4 rounded-xl text-xs font-bold flex items-start gap-2 border animate-in slide-in-from-top-2 ${
                status.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {status.type === 'success' ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="shrink-0 mt-0.5" />}
                <span className="leading-relaxed">{status.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* LADO DIREITO: REGRAS E COLUNAS */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info size={18} className="text-slate-400" />
                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Regras de Preenchimento (PNTP)</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">SEPARADOR: PONTO E VÍRGULA (;)</span>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white text-[10px] font-black text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 w-1/4">Coluna (Header)</th>
                    <th className="px-4 py-3 text-center w-24">Obrig.</th>
                    <th className="px-6 py-3">Descrição Técnica e Formato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[11px]">
                  {colunasCartilha.map((col, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-2.5 font-mono font-bold text-slate-700 group-hover:text-black">{col.campo}</td>
                      <td className="px-4 py-2.5 text-center">
                        {col.obr === 'Sim' 
                          ? <span className="text-red-600 font-black bg-red-50 px-1.5 py-0.5 rounded text-[9px]">SIM</span> 
                          : <span className="text-slate-300 font-bold text-[9px]">NÃO</span>}
                      </td>
                      <td className="px-6 py-2.5 text-slate-500 font-medium">{col.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}