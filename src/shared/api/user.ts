import { apiClient } from './client';
import { DepositRequest, BalanceResponse, ErrorResponse } from './types';
import { AxiosError } from 'axios';

export class UserAPI {
  /**
   * Получить текущий баланс пользователя
   * Согласно Swagger: GET /pay/balance
   */
  static async getBalance(): Promise<number> {
    try {
      const response = await apiClient.getClient().get<BalanceResponse>('/pay/balance');
      return response.data.balance;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Пополнить баланс
   * Согласно Swagger: POST /pay/deposit
   */
  static async deposit(amount: number): Promise<void> {
    try {
      const data: DepositRequest = { amount };
      await apiClient.getClient().post('/pay/deposit', data);
    } catch (error) {
      throw this.handleError(error);
    }
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

