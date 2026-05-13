import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { hostBackend } from '~/assets/config';

export const api: AxiosInstance = axios.create({
  baseURL: hostBackend,
  withCredentials: false,
});

export const backendBaseUrl = hostBackend || ''

api.interceptors.response.use(
  response => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      if (error.response.status && (error.response.status === 401 || error.response.status === 403)) {
        console.error('Unauthorized access. Please log in again.');
      }
    } else {
      console.error('An unexpected error:', error.message);
    }

    return Promise.reject(error);
  }
);
