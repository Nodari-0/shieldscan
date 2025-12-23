import axios, { AxiosInstance, AxiosError } from 'axios';
import { getIdToken } from '../firebase/auth';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Create axios instance with default config
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Request interceptor to add auth token
 */
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const message = (error.response.data as any)?.error || 'An error occurred';

      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          toast.error('Session expired. Please login again.');
          window.location.href = '/login';
          break;
        case 403:
          toast.error('You do not have permission to perform this action.');
          break;
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(message);
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
