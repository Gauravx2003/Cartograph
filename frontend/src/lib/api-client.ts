import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'https://cartograph-jg01.onrender.com/api',
  withCredentials: true,
});
