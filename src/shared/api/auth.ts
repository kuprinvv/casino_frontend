import { apiClient } from './client';
import { AxiosError } from 'axios';

// API Types согласно Swagger
export interface RegisterRequest {
  name: string;
  login: string;
  password: string;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
}

export interface ErrorResponse {
  error: string;
}

export class AuthAPI {
  /**
   * Регистрация нового пользователя
   * Возвращает access_token в теле ответа
   * refresh_token и session_id устанавливаются через HTTP-only cookies
   */
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.getClient().post<AuthResponse>('/auth/register', data);
      
      // Сохраняем access_token после успешной регистрации
      if (response.data.access_token) {
        apiClient.setAuthToken(response.data.access_token);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Вход в систему
   * Возвращает access_token в теле ответа
   * refresh_token и session_id устанавливаются через HTTP-only cookies
   */
  static async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.getClient().post<AuthResponse>('/auth/login', data);
      
      // Сохраняем access_token после успешного входа
      if (response.data.access_token) {
        apiClient.setAuthToken(response.data.access_token);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Обновление access токена
   * Использует session_id и refresh_token из cookies
   */
  static async refresh(): Promise<AuthResponse> {
    try {
      const response = await apiClient.getClient().post<AuthResponse>('/auth/refresh');
      
      // Обновляем access_token
      if (response.data.access_token) {
        apiClient.setAuthToken(response.data.access_token);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Выход из системы
   * Закрывает сессию и удаляет cookies
   */
  static async logout(): Promise<void> {
    try {
      await apiClient.getClient().post('/auth/logout');
      // Очищаем токен на клиенте
      apiClient.clearAuthToken();
    } catch (error) {
      // Даже если запрос не удался, очищаем токен на клиенте
      apiClient.clearAuthToken();
      throw this.handleError(error);
    }
  }

  /**
   * Проверить, авторизован ли пользователь
   */
  static isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }

  /**
   * Обработка ошибок
   */
  private static handleError(error: unknown): Error {
    if (error instanceof AxiosError) {
      const errorData = error.response?.data as ErrorResponse;
      return new Error(errorData?.error || error.message || 'Произошла ошибка');
    }
    return new Error('Неизвестная ошибка');
  }
}

