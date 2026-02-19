export interface DepositRequest {
    amount: number;
}

export interface SpinRequest {
    bet: number;
}

export interface BuyBonusRequest {
    bet: number;
}

export interface SpinApiResponse {
    board: string[][];
    line_wins: LineWinAPI[];
    scatter_count: number;
    scatter_payout: number;
    awarded_free_spins: number;
    total_payout: number;
    balance: number;
    free_spin_count: number;
}

export interface LineWinAPI {
    line: number;
    symbol: string;
    count: number;
    payout: number;
}

export interface BalanceResponse {
    balance: number;
}

export interface ErrorResponse {
    error: string;
}