'use client';

import { useState } from 'react';
import api from '@/services/api';
import { 
  UploadCloud, FileSpreadsheet, Download, CheckCircle, 
  AlertTriangle, Info, FileType, Loader2, Landmark, FileCheck, X 
} from 'lucide-react';

export function ImportarFolha() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [inputKey, setInputKey] = useState(0);

  const handleDownloadModel = () => {
    const header = "cpf;exercicio;mes;remuneracao_bruta;verbas_indenizatorias;descontos_legais;salario_liquido";
    const example = "12345678901;2025;1;5500,00;250,00;650,00;5100,00";
    const csvContent = `${header}\n${example}`;
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_importacao_folha.csv');
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
      await api.post('/folha-pagamento/importar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus({ type: 'success', message: 'Folha de pagamento importada com sucesso!' });
      setFile(null); 
    } catch (error: any) {
      setStatus({ type: 'error', message: 'Erro na importação. Certifique-se que o CPF do servidor já esteja cadastrado no sistema.' });
    } finally {
      setLoading(false);
      setInputKey(prev => prev + 1);
    }
  };

  const colunas = [
    { campo: 'cpf', obr: 'Sim', desc: 'Deve ser o mesmo cadastrado no Servidor' },
    { campo: 'exercicio', obr: 'Sim', desc: 'Ano de referência (ex: 2025)' },
    { campo: 'mes', obr: 'Sim', desc: 'Mês numérico (1 a 12)' },
    { campo: 'remuneracao_bruta', obr: 'Sim', desc: 'Vencimento Base + Vantagens' },
    { campo: 'verbas_indenizatorias', obr: 'Não', desc: 'Diárias, Auxílios, etc.' },
    { campo: 'descontos_legais', obr: 'Sim', desc: 'Previdência, IRRF, etc.' },
    { campo: 'salario_liquido', obr: 'Sim', desc: 'Valor final creditado' },
  ];

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="mb-8 border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-lg"><Landmark size={24} /></div>
          Carga Massiva de Folha de Pagamento
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">1. Download Layout</h3>
            <button onClick={handleDownloadModel} className="w-full bg-slate-50 border border-slate-300 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-2 text-xs uppercase">
              <Download size={16} /> Baixar Layout Folha
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">2. Envio do Arquivo</h3>
            <div className={`border-2 border-dashed rounded-xl p-8 text-center relative ${file ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'}`}>
              <input key={inputKey} type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <FileSpreadsheet size={32} className={`mx-auto mb-3 ${file ? 'text-blue-600' : 'text-slate-400'}`} />
              <p className="text-xs font-bold text-slate-600">{file ? file.name : "Arquivo da Folha (CSV)"}</p>
            </div>

            {file && (
              <button onClick={handleUpload} disabled={loading} className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase text-xs">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                {loading ? "Processando..." : "Importar Folha"}
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
              <h3 className="font-bold text-slate-700 text-xs uppercase">Regras de Preenchimento</h3>
            </div>
            <table className="w-full text-left text-[11px]">
              <thead className="text-[10px] font-black text-slate-500 uppercase border-b border-slate-200">
                <tr><th className="px-6 py-3">Coluna</th><th className="px-4 py-3 text-center">Obrig.</th><th className="px-6 py-3">Nota Técnica</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
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
          <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
             <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
             <p className="text-[10px] text-amber-800 leading-relaxed uppercase font-bold tracking-tight">
                Atenção: O sistema realiza o cruzamento automático via CPF. Se um servidor presente no arquivo não estiver cadastrado na aba "Servidores", a linha será ignorada.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}