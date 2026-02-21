'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '@/services/api';
import { Sidebar } from '@/components/Sidebar';
import {
  AlertCircle,
  X,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle,
  Shield,
  UserX,
  UserCheck,
  Key // <-- Novo ícone para a senha
} from 'lucide-react';

// --- INTERFACES ---
interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  dataCriacao: string;
}

const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(children, modalRoot);
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados do Modal de Criação/Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  
  // Estados do Modal de Senha
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ id: 0, nome: '', novaSenha: '' });

  // Dados do Formulário
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    role: 'USER'
  });

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/usuarios');
      setUsuarios(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Não foi possível carregar os usuários.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ nome: '', email: '', senha: '', role: 'USER' });
    setIsModalOpen(true);
  };

  const openEditModal = (user: Usuario) => {
    setEditingUser(user);
    setFormData({ nome: user.nome, email: user.email, senha: '', role: user.role });
    setIsModalOpen(true);
  };

  const openPasswordModal = (user: Usuario) => {
    setPasswordData({ id: user.id, nome: user.nome, novaSenha: '' });
    setIsPasswordModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingUser) {
        // Atualiza Perfil (PUT)
        await api.put(`/usuarios/${editingUser.id}`, {
          nome: formData.nome,
          email: formData.email,
          role: formData.role
        });
        showSuccess("Usuário atualizado com sucesso!");
      } else {
        // Cria Novo (POST)
        if (!formData.senha) {
          setError("A senha é obrigatória para novos usuários.");
          return;
        }
        await api.post('/usuarios', formData);
        showSuccess("Usuário criado com sucesso!");
      }
      setIsModalOpen(false);
      fetchUsuarios();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao salvar usuário.");
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Atualiza apenas a senha (PATCH)
      await api.patch(`/usuarios/${passwordData.id}/senha`, { 
        novaSenha: passwordData.novaSenha 
      });
      showSuccess("Senha alterada com sucesso!");
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao alterar a senha.");
    }
  };

  const handleToggleStatus = async (id: number, ativo: boolean) => {
    if (!confirm(`Deseja realmente ${ativo ? 'desativar' : 'ativar'} este usuário?`)) return;
    
    try {
      await api.patch(`/usuarios/${id}/status`);
      showSuccess(`Usuário ${ativo ? 'desativado' : 'ativado'} com sucesso!`);
      fetchUsuarios();
    } catch (err: any) {
      setError("Erro ao alterar o status do usuário.");
    }
  };

  const formatDate = (val: string) => {
    if (!val) return "---";
    return new Date(val).toLocaleDateString('pt-BR');
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-y-auto relative z-0">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Usuários</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Controle de Acesso • IAM</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={openCreateModal}
              className="flex items-center px-4 py-2 border rounded-xl shadow-sm font-bold text-xs uppercase bg-black text-white hover:bg-slate-800 transition-all"
            >
              <UserPlus size={14} className="mr-2" /> Novo Usuário
            </button>
          </div>
        </header>

        {error && !isModalOpen && !isPasswordModalOpen && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-200 animate-in fade-in duration-300">
            <AlertCircle className="mr-2" size={20} /> {error}
          </div>
        )}

        {successMsg && !isModalOpen && !isPasswordModalOpen && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-center border border-green-200 animate-in fade-in duration-300">
            <CheckCircle className="mr-2" size={20} /> {successMsg}
          </div>
        )}

        {/* --- TABELA DE USUÁRIOS --- */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4">Nome & E-mail</th>
                  <th className="px-6 py-4">Perfil</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Criado em</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                   [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-6 bg-slate-50/20"></td></tr>)
                ) : usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhum usuário encontrado.</td>
                  </tr>
                ) : (
                  usuarios.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors text-xs group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{user.nome}</div>
                        <div className="text-[10px] text-slate-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide border flex w-fit items-center gap-1 ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          <Shield size={10} /> {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide border flex w-fit items-center gap-1 ${user.ativo ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                           {user.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-semibold">{formatDate(user.dataCriacao)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => openEditModal(user)} 
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" 
                            title="Editar Perfil"
                          >
                            <Edit2 size={16} />
                          </button>
                          
                          {/* BOTÃO DE ALTERAR SENHA AQUI */}
                          <button 
                            onClick={() => openPasswordModal(user)} 
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-all" 
                            title="Alterar Senha"
                          >
                            <Key size={16} />
                          </button>

                          <button 
                            onClick={() => handleToggleStatus(user.id, user.ativo)} 
                            className={`p-1.5 rounded transition-all ${user.ativo ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`}
                            title={user.ativo ? "Desativar Usuário" : "Ativar Usuário"}
                          >
                            {user.ativo ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* --- MODAL DE CRIAÇÃO / EDIÇÃO DE PERFIL --- */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  {editingUser ? <Edit2 size={18} className="text-blue-600"/> : <UserPlus size={18} className="text-black"/>}
                  {editingUser ? 'Editar Perfil' : 'Novo Usuário'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center border border-red-200">
                    <AlertCircle className="mr-2" size={14} /> {error}
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nome Completo</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.nome} 
                    onChange={e => setFormData({...formData, nome: e.target.value})} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm" 
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">E-mail (Login)</label>
                  <input 
                    type="email" 
                    required 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm" 
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Senha Inicial</label>
                    <input 
                      type="password" 
                      required={!editingUser}
                      value={formData.senha} 
                      onChange={e => setFormData({...formData, senha: e.target.value})} 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm" 
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Perfil de Acesso</label>
                  <select 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value})} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm font-medium"
                  >
                    <option value="USER">Usuário Padrão (Leitura)</option>
                    <option value="ADMIN">Administrador (Total)</option>
                  </select>
                </div>

                <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-black uppercase transition-all">Cancelar</button>
                  <button type="submit" className="px-6 py-2 bg-black hover:bg-slate-800 text-white font-bold rounded-lg transition-all text-xs uppercase shadow-md">
                    {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* --- MODAL ESPECÍFICO DE TROCA DE SENHA --- */}
      {isPasswordModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              
              <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                  <Key size={18} className="text-amber-600"/> Alterar Senha
                </h3>
                <button onClick={() => setIsPasswordModalOpen(false)} className="text-amber-700 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handlePasswordSave} className="p-6 space-y-4">
                <div className="text-xs text-slate-500 mb-4">
                  Defina uma nova senha de acesso para o usuário <strong className="text-slate-800">{passwordData.nome}</strong>.
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center border border-red-200">
                    <AlertCircle className="mr-2" size={14} /> {error}
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nova Senha</label>
                  <input 
                    type="password" 
                    required 
                    value={passwordData.novaSenha} 
                    onChange={e => setPasswordData({...passwordData, novaSenha: e.target.value})} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 text-sm" 
                    placeholder="••••••••"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-black uppercase transition-all">Cancelar</button>
                  <button type="submit" className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-all text-xs uppercase shadow-md">
                    Confirmar Senha
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}