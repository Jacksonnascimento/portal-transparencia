'use client';

import { useState } from 'react';
import api from '@/services/api';
import { 
  UploadCloud, FileSpreadsheet, Download, CheckCircle, 
  AlertTriangle, Info, FileType, Loader2, Users, FileCheck, X 
} from 'lucide-react';

export function ImportarServidores() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [inputKey, setInputKey] = useState(0);

  const handleDownloadModel = () => {
    const header = "nome;cpf;matricula;cargo;lotacao;tipo_vinculo;data_admissao;carga_horaria;empresa_contratante;cnpj_contratante";
    const example = "JOAO DA SILVA;12345678901;100250;ASSISTENTE ADMINISTRATIVO;SECRETARIA DE FINANCAS;ESTATUTARIO;01/02/2024;40;;";
    const csvContent = `${header}\n${example}`;
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_importacao_servidores.csv');
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
      await api.post('/servidores/importar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus({ type: 'success', message: 'Base de servidores atualizada com sucesso!' });
      setFile(null); 
    } catch (error: any) {
      setStatus({ type: 'error', message: 'Falha ao processar CSV. Verifique se as datas estão no formato DD/MM/AAAA e se o CPF possui 11 dígitos.' });
    } finally {
      setLoading(false);
      setInputKey(prev => prev + 1);
    }
  };

  const colunas = [
    { campo: 'nome', obr: 'Sim', desc: 'Nome completo do servidor' },
    { campo: 'cpf', obr: 'Sim', desc: 'Apenas números (11 dígitos)' },
    { campo: 'matricula', obr: 'Sim', desc: 'Número de registro funcional' },
    { campo: 'cargo', obr: 'Sim', desc: 'Nome do cargo ou função' },
    { campo: 'lotacao', obr: 'Sim', desc: 'Secretaria ou Departamento' },
    { campo: 'tipo_vinculo', obr: 'Sim', desc: 'Estatutário, Comissionado, etc.' },
    { campo: 'data_admissao', obr: 'Sim', desc: 'Formato DD/MM/AAAA' },
    { campo: 'carga_horaria', obr: 'Sim', desc: 'Horas semanais (número)' },
    { campo: 'empresa_contratante', obr: 'Não', desc: 'Para terceirizados' },
    { campo: 'cnpj_contratante', obr: 'Não', desc: 'Para terceirizados (14 dígitos)' },
  ];

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="mb-8 border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-slate-900 text-white rounded-lg"><Users size={24} /></div>
          Importar Cadastro de Servidores
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">1. Preparação</h3>
            <button onClick={handleDownloadModel} className="w-full bg-slate-50 border border-slate-300 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-2 text-xs uppercase">
              <Download size={16} /> Baixar Modelo CSV
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">2. Upload</h3>
            <div className={`border-2 border-dashed rounded-xl p-8 text-center relative ${file ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-slate-400'}`}>
              <input key={inputKey} type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <FileType size={32} className={`mx-auto mb-3 ${file ? 'text-emerald-600' : 'text-slate-400'}`} />
              <p className="text-xs font-bold text-slate-600">{file ? file.name : "Selecionar arquivo de Servidores"}</p>
            </div>

            {file && (
              <button onClick={handleUpload} disabled={loading} className="w-full mt-4 py-3 bg-black text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase text-xs">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                {loading ? "Processando..." : "Enviar Cadastro"}
              </button>
            )}

            {status.message && (
              <div className={`mt-4 p-4 rounded-xl text-xs font-bold flex gap-2 border ${status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                <span>{status.message}</span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Info size={18} className="text-slate-400" />
              <h3 className="font-bold text-slate-700 text-xs uppercase">Layout do Arquivo</h3>
            </div>
            <table className="w-full text-left">
              <thead className="text-[10px] font-black text-slate-500 uppercase border-b border-slate-200">
                <tr><th className="px-6 py-3">Coluna</th><th className="px-4 py-3 text-center">Obrig.</th><th className="px-6 py-3">Descrição</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[11px]">
                {colunas.map((col, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-2.5 font-mono font-bold text-slate-700">{col.campo}</td>
                    <td className="px-4 py-2.5 text-center">{col.obr === 'Sim' ? <span className="text-red-600 font-black">SIM</span> : <span className="text-slate-300">NÃO</span>}</td>
                    <td className="px-6 py-2.5 text-slate-500">{col.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}