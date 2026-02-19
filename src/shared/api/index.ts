// Экспорт всех API модулей
export { AuthAPI } from './auth';
export { UserAPI } from './user';
export { GameAPI } from './game';
export { CascadeAPI } from './cascade';
export { apiClient } from './client';

// Экспорт типов
export type {
  DepositRequest,
  SpinRequest,
  BuyBonusRequest,
  SpinResult,
  LineWinAPI,
  BonusSpinResponse,
  BalanceResponse,
  ErrorResponse
} from './types';

// Экспорт auth типов
export type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
} from './auth';

// Экспорт cascade типов
export type {
  CascadeSpinRequest,
  CascadeSpinResponse,
  CascadeStep,
  ClusterInfo,
  Position,
  NewSymbol,
  BuyCascadeBonusRequest,
} from './cascade';

