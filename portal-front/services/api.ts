import axios from 'axios';

const api = axios.create({
  // Se não houver variável de ambiente, o padrão é o localhost
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1`,
});

export default api;