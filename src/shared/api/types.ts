// API Request types
export interface DepositRequest {
    amount: number;
}

export interface SpinRequest {
    bet: number;
}

export interface BuyBonusRequest {
    bet: number;
}

export interface BonusSpinResponse {
    board: string[][];              // [5][3] символы
    line_wins: LineWinAPI[];        // массив выигрышных линий
    scatter_count: number;
    scatter_payout: number;
    awarded_free_spins: number;     // сколько начислено в этом спине
    total_payout: number;
    balance: number;
    free_spin_count: number;        // сколько осталось после этого спина
}

// API Response types - соответствуют структуре бекенда согласно Swagger
export interface SpinResult {
    board: string[][]; // 5x3 массив символов
    line_wins: LineWinAPI[]; // Выигрышные линии
    scatter_count: number; // Количество скаттеров
    scatter_payout: number; // Выплата по скаттерам
    awarded_free_spins: number; // Начислено фриспинов
    total_payout: number; // Общая выплата
    balance: number; // Баланс после спина
    free_spin_count: number; // Остаток фриспинов
    in_free_spin: boolean; // Это фриспин?
}

export interface LineWinAPI {
    line: number; // Номер линии 1-20
    symbol: string; // ID символа
    count: number; // Количество символов 3-5
    payout: number; // Выплата
}

// Согласно Swagger: GET /pay/balance
export interface BalanceResponse {
    balance: number; // Текущий баланс пользователя
}

// Error response
export interface ErrorResponse {
    error: string;
}
