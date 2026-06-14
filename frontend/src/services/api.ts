const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    };

    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  private async upload(endpoint: string, formData: FormData): Promise<any> {
    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(`${BASE_URL}${endpoint}`, { method: 'POST', headers, body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  }

  // Auth
  login = (email: string, password: string) =>
    this.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

  register = (name: string, email: string, password: string) =>
    this.request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });

  googleLogin = (credential: any) =>
    this.request('/auth/google', { method: 'POST', body: JSON.stringify(credential) });

  getProfile = () => this.request('/auth/profile');

  updateProfile = (data: any) =>
    this.request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) });

  changePassword = (currentPassword: string, newPassword: string) =>
    this.request('/auth/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });

  forgotPassword = (email: string) =>
    this.request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });

  resetPassword = (token: string, password: string) =>
    this.request(`/auth/reset-password/${token}`, { method: 'POST', body: JSON.stringify({ password }) });

  // Expenses
  getExpenses = (params?: string) => this.request(`/expenses${params ? '?' + params : ''}`);
  getExpense = (id: string) => this.request(`/expenses/${id}`);
  createExpense = (data: any) => this.request('/expenses', { method: 'POST', body: JSON.stringify(data) });
  updateExpense = (id: string, data: any) => this.request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  deleteExpense = (id: string) => this.request(`/expenses/${id}`, { method: 'DELETE' });
  scanReceipt = (formData: FormData) => this.upload('/expenses/scan-receipt', formData);

  // Income
  getIncomes = (params?: string) => this.request(`/income${params ? '?' + params : ''}`);
  getIncome = (id: string) => this.request(`/income/${id}`);
  createIncome = (data: any) => this.request('/income', { method: 'POST', body: JSON.stringify(data) });
  updateIncome = (id: string, data: any) => this.request(`/income/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  deleteIncome = (id: string) => this.request(`/income/${id}`, { method: 'DELETE' });

  // Budget
  getBudgets = () => this.request('/budget');
  createBudget = (data: any) => this.request('/budget', { method: 'POST', body: JSON.stringify(data) });
  updateBudget = (id: string, data: any) => this.request(`/budget/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  deleteBudget = (id: string) => this.request(`/budget/${id}`, { method: 'DELETE' });
  getBudgetReport = () => this.request('/budget/report');

  // Reports
  getDashboard = (params?: string) => this.request(`/reports/dashboard${params ? '?' + params : ''}`);
  getMonthlyReport = (year?: number) => this.request(`/reports/monthly${year ? '?year=' + year : ''}`);
  getYearlyReport = () => this.request('/reports/yearly');

  // AI
  getPredictions = () => this.request('/ai/predict', { method: 'POST' });
  getSavingAdvice = () => this.request('/ai/saving-advice');
  getFinancialHealth = () => this.request('/ai/financial-health');
  chatWithAI = (message: string, context?: any) =>
    this.request('/ai/chat', { method: 'POST', body: JSON.stringify({ message, context }) });
  voiceExpense = (transcript: string) =>
    this.request('/ai/voice-expense', { method: 'POST', body: JSON.stringify({ transcript }) });

  // Notifications
  getNotifications = (params?: string) => this.request(`/notifications${params ? '?' + params : ''}`);
  markAsRead = (id: string) => this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  markAllAsRead = () => this.request('/notifications/read-all', { method: 'POST' });
  deleteNotification = (id: string) => this.request(`/notifications/${id}`, { method: 'DELETE' });
  getNotificationPreferences = () => this.request('/notifications/preferences');
  updateNotificationPreferences = (data: any) =>
    this.request('/notifications/preferences', { method: 'PUT', body: JSON.stringify(data) });
}

export const api = new ApiService();
