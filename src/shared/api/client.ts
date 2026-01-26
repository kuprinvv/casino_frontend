import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// URL бекенда - можно настроить через переменные окружения
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
      withCredentials: true, // Включаем поддержку cookies для refresh_token и session_id
    });

    // Загружаем токен из localStorage при инициализации
    this.token = localStorage.getItem('auth_token');
    if (this.token) {
      this.setAuthToken(this.token);
    }

    // Интерсептор для обработки ошибок и автоматического обновления токена
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Если получили 401 и это не запрос на refresh и не запрос на auth
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            !originalRequest.url?.includes('/auth/refresh') &&
            !originalRequest.url?.includes('/auth/login') &&
            !originalRequest.url?.includes('/auth/register')) {
          
          if (this.isRefreshing) {
            // Если уже идет обновление токена, добавляем запрос в очередь
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Пытаемся обновить токен через refresh endpoint
            const response = await axios.post<{ access_token: string }>(
              `${API_BASE_URL}/auth/refresh`,
              {},
              { withCredentials: true }
            );

            if (response.data.access_token) {
              this.setAuthToken(response.data.access_token);
              
              // Обрабатываем очередь запросов
              this.processQueue(null);
              
              // Повторяем оригинальный запрос с новым токеном
              originalRequest.headers['Authorization'] = `Bearer ${response.data.access_token}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Если refresh не удался, очищаем токен и отклоняем все запросы
            this.processQueue(refreshError);
            this.clearAuthToken();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve();
      }
    });
    this.failedQueue = [];
  }

  // Установить токен авторизации
  setAuthToken(token: string) {
    this.token = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('auth_token', token);
  }

  // Очистить токен авторизации
  clearAuthToken() {
    this.token = null;
    delete this.client.defaults.headers.common['Authorization'];
    localStorage.removeItem('auth_token');
  }

  // Получить текущий токен
  getToken(): string | null {
    return this.token;
  }

  // Проверить, авторизован ли пользователь
  isAuthenticated(): boolean {
    return this.token !== null;
  }

  // Получить axios клиент
  getClient(): AxiosInstance {
    return this.client;
  }
}

// Экспортируем единственный экземпляр
export const apiClient = new ApiClient();

