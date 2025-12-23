import apiClient from '../api/client';
import { Scan, UserProfile, SubscriptionPlan } from '../types';

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (email: string, password: string, displayName?: string) => {
    const response = await apiClient.post('/auth/register', { email, password, displayName });
    return response.data;
  },
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};

// Scan API
export const scanApi = {
  create: async (targetUrl: string): Promise<{ success: boolean; data: Scan }> => {
    const response = await apiClient.post('/scans', { targetUrl });
    return response.data;
  },
  list: async (): Promise<{ success: boolean; data: Scan[] }> => {
    const response = await apiClient.get('/scans');
    return response.data;
  },
  get: async (scanId: string): Promise<{ success: boolean; data: Scan }> => {
    const response = await apiClient.get(`/scans/${scanId}`);
    return response.data;
  },
  getReport: async (scanId: string): Promise<Blob> => {
    const response = await apiClient.get(`/scans/${scanId}/report`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// User API
export const userApi = {
  getProfile: async (): Promise<{ success: boolean; data: UserProfile }> => {
    const response = await apiClient.get('/user/profile');
    return response.data;
  },
  updateProfile: async (data: Partial<UserProfile>) => {
    const response = await apiClient.put('/user/profile', data);
    return response.data;
  },
  getUsage: async () => {
    const response = await apiClient.get('/user/usage');
    return response.data;
  },
  updateSettings: async (settings: any) => {
    const response = await apiClient.put('/user/settings', settings);
    return response.data;
  },
};

// Subscription API
export const subscriptionApi = {
  create: async (priceId: string) => {
    const response = await apiClient.post('/subscriptions/create', { priceId });
    return response.data;
  },
  cancel: async () => {
    const response = await apiClient.post('/subscriptions/cancel');
    return response.data;
  },
  getPlans: async (): Promise<{ success: boolean; data: SubscriptionPlan[] }> => {
    const response = await apiClient.get('/subscriptions/plans');
    return response.data;
  },
};
