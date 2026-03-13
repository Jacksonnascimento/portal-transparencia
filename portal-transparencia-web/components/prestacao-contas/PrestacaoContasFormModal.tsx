"use client";

import React, { useState } from 'react';
import { X, UploadCloud, FileText, AlertTriangle } from 'lucide-react';
import { prestacaoContasService, PrestacaoContasRequest } from '@/services/prestacaoContasService';

interface ModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PrestacaoContasFormModal({ onClose, onSuccess }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [erro, setErro] = useState('');

  const [formData, setFormData] = useState({
    tipoRelatorio: '',
    exercicio: new Date().getFullYear(),
    tipoPeriodo: '',
    periodo: '',
    dataPublicacao: new Date().toISOString().split('T')[0],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Blindagem extra via código para garantir que Exercício e Período nunca sejam negativos
    let valorTratado = value;
    if (e.target.type === 'number') {
        const num = parseInt(value);
        if (num < 0) valorTratado = '0'; // Se tentar digitar negativo, vira 0
    }

    setFormData((prev) => {
      const newData = { ...prev, [name]: valorTratado };
      
      // Lógica de UX: Se escolher Balanço Geral, força a ser Anual e limpa o período
      if (name === 'tipoRelatorio' && value === 'BALANCO_GERAL') {
        newData.tipoPeriodo = 'ANUAL';
        newData.periodo = '';
      }
      return newData;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setErro('Por favor, selecione estritamente um ficheiro PDF.');
        setFile(null);
        return;
      }
      setErro('');
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!file) {
      setErro('O ficheiro PDF é obrigatório.');
      return;
    }

    if (!formData.tipoRelatorio || !formData.tipoPeriodo || !formData.dataPublicacao) {
      setErro('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setLoading(true);
      
      const requestData: PrestacaoContasRequest = {
        tipoRelatorio: formData.tipoRelatorio,
        exercicio: Number(formData.exercicio),
        tipoPeriodo: formData.tipoPeriodo,
        dataPublicacao: formData.dataPublicacao,
      };

      if (formData.periodo) {
        requestData.periodo = Number(formData.periodo);
      }

      await prestacaoContasService.salvar(requestData, file);
      onSuccess();
    } catch (error: any) {
      console.error('Erro no upload', error);
      setErro(error.response?.data?.message || 'Ocorreu um erro ao guardar o documento. Verifique a ligação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      {/* Caixa do Modal */}
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-white tracking-wide">Nova Publicação Fisco-Contábil</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Formulário */}
        <div className="p-6 overflow-y-auto">
          {erro && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 text-red-800 text-sm font-medium rounded-r-md">
              {erro}
            </div>
          )}

          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md flex gap-3 text-amber-800">
            <AlertTriangle size={24} className="shrink-0 text-amber-600" />
            <div className="text-sm">
              <strong className="block mb-1 font-bold">Aviso de Conformidade (PNTP)</strong>
              O ficheiro a submeter deve ser um <strong>PDF Pesquisável</strong> (gerado nativamente pelo sistema contábil). PDFs gerados a partir de imagens digitalizadas (scanners) violam as diretrizes de transparência e dados abertos.
            </div>
          </div>

          <form id="form-prestacao" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Tipo de Relatório <span className="text-red-500">*</span></label>
                <select 
                  name="tipoRelatorio" 
                  value={formData.tipoRelatorio} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
                  required
                >
                  <option value="" disabled>Selecione o tipo...</option>
                  <option value="RREO">RREO - Relatório Resumido da Exec. Orçamentária</option>
                  <option value="RGF">RGF - Relatório de Gestão Fiscal</option>
                  <option value="BALANCO_GERAL">Balanço Geral (Anual)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Exercício (Ano) <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  name="exercicio" 
                  value={formData.exercicio} 
                  onChange={handleInputChange}
                  min="2000" // Blindagem HTML
                  max="2100" // Blindagem HTML
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Tipo de Período <span className="text-red-500">*</span></label>
                <select 
                  name="tipoPeriodo" 
                  value={formData.tipoPeriodo} 
                  onChange={handleInputChange}
                  disabled={formData.tipoRelatorio === 'BALANCO_GERAL'}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                  required
                >
                  <option value="" disabled>Selecione...</option>
                  <option value="BIMESTRE">Bimestre</option>
                  <option value="QUADRIMESTRE">Quadrimestre</option>
                  <option value="SEMESTRE">Semestre</option>
                  <option value="ANUAL">Anual</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Período {formData.tipoRelatorio !== 'BALANCO_GERAL' && <span className="text-red-500">*</span>}
                </label>
                <input 
                  type="number" 
                  name="periodo" 
                  value={formData.periodo} 
                  onChange={handleInputChange}
                  disabled={formData.tipoPeriodo === 'ANUAL' || formData.tipoRelatorio === 'BALANCO_GERAL'}
                  min="1" // Blindagem HTML
                  max="6" // Blindagem HTML (Bimestre vai até 6)
                  placeholder="Ex: 1, 2, 3..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-100"
                  required={formData.tipoPeriodo !== 'ANUAL'}
                />
              </div>

              <div className="space-y-1 md:col-span-2 border-b border-slate-200 pb-5">
                <label className="text-sm font-semibold text-slate-700">Data de Publicação <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  name="dataPublicacao" 
                  value={formData.dataPublicacao} 
                  onChange={handleInputChange}
                  className="w-full md:w-1/2 px-3 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                  required
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Ficheiro PDF do Relatório <span className="text-red-500">*</span></label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md hover:border-emerald-600 hover:bg-emerald-50 transition-colors bg-slate-50 relative">
                  <div className="space-y-2 text-center">
                    {file ? (
                      <div className="flex flex-col items-center">
                        <FileText className="mx-auto h-12 w-12 text-emerald-600" />
                        <div className="text-sm text-slate-900 font-medium mt-2">{file.name}</div>
                        <div className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                        <div className="flex text-sm text-slate-600 justify-center">
                          <label className="relative cursor-pointer rounded-md font-medium text-emerald-700 hover:text-emerald-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500">
                            <span>Selecione um ficheiro</span>
                            <input type="file" className="sr-only" accept=".pdf,application/pdf" onChange={handleFileChange} />
                          </label>
                          <p className="pl-1">ou arraste para aqui</p>
                        </div>
                        <p className="text-xs text-slate-500">Exclusivamente PDF pesquisável</p>
                      </>
                    )}
                  </div>
                  {/* Cobre o div todo para facilitar o clique */}
                  {!file && <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,application/pdf" onChange={handleFileChange} title="" />}
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* Rodapé (Botões de Ação) */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-prestacao"
            disabled={loading}
            className="px-6 py-2 bg-emerald-700 border border-transparent rounded-md text-sm font-medium text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-900 transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                A Guardar...
              </>
            ) : (
              'Guardar Documento'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}