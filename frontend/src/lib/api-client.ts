import axios from 'axios';

console.log('VITE_BACKEND_URL', import.meta.env.VITE_BACKEND_URL);

export const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
  withCredentials: true,
});
