import { apiClient } from './client';
import {SpinRequest, SpinResult, ErrorResponse, BuyBonusRequest, DataResponse, LineWinAPI} from './types';
import { AxiosError } from 'axios';
import { Symbol, SymbolType, WinningLine } from '@shared/types/game';
import { PAYLINES } from '@shared/config/lines';

export class GameAPI {
    /**
     * Получить текущие данные игрока (баланс + остаток фриспинов)
     * Предполагаемый эндпоинт: GET /line/data
     */
    static async getData(): Promise<DataResponse> {
        try {
            const response = await apiClient.getClient().get<DataResponse>('/line/data');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Обычный спин (или фриспин, бэкенд сам решает по состоянию)
     * POST /line/spin
     */
    static async spin(bet: number): Promise<{
        reels: Symbol[][];
        winAmount: number;
        balance: number;
        winningLines: WinningLine[];
        scatterCount: number;
        scatterPayout: number;
        awardedFreeSpins: number;
        freeSpinCount: number;
        inFreeSpin: boolean;
    }> {
        try {
            const data: SpinRequest = { bet };
            const response = await apiClient.getClient().post<SpinResult>('/line/spin', data);

            return this.processSpinResponse(response.data);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Покупка бонусной игры
     * POST /line/buy-bonus → возвращает результат ПЕРВОГО бонусного спина
     */
    static async buyBonus(bet: number): Promise<{
        reels: Symbol[][];
        winAmount: number;
        balance: number;
        winningLines: WinningLine[];
        scatterCount: number;
        scatterPayout: number;
        awardedFreeSpins: number;
        freeSpinCount: number;
        inFreeSpin: boolean;
    }> {
        try {
            const data: BuyBonusRequest = { bet };
            const response = await apiClient.getClient().post<SpinResult>('/line/buy-bonus', data);

            // Обрабатываем точно так же, как обычный спин
            return this.processSpinResponse(response.data);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Общая логика обработки ответа от спина (обычного или бонусного)
     */
    private static processSpinResponse(data: SpinResult): {
        reels: Symbol[][];
        winAmount: number;
        balance: number;
        winningLines: WinningLine[];
        scatterCount: number;
        scatterPayout: number;
        awardedFreeSpins: number;
        freeSpinCount: number;
        inFreeSpin: boolean;
    } {
        const reels = this.convertBoardToReels(data.board);
        const winAmount = data.total_payout;
        const winningLines = this.convertWinningLinesFromAPI(data.line_wins);

        console.log('🎰 Processed spin result:', {
            board: data.board,
            totalPayout: winAmount,
            freeSpinCount: data.free_spin_count,
            inFreeSpin: data.in_free_spin,
        });

        // Добавляем scatter как специальную "линию", если есть выплата
        let scatterCount = data.scatter_count;
        let scatterPayout = data.scatter_payout;
        if (scatterCount >= 3 && scatterPayout > 0) {
            const scatterPositions: number[][] = [];
            data.board.forEach((reel, reelIndex) => {
                reel.forEach((symbol, rowIndex) => {
                    if (symbol === 'B') {
                        scatterPositions.push([reelIndex, rowIndex]);
                    }
                });
            });

            winningLines.push({
                lineIndex: -1,
                symbols: SymbolType.BONUS,
                count: scatterCount,
                multiplier: 0,
                winAmount: scatterPayout,
                positions: scatterPositions,
            });
        }

        return {
            reels,
            winAmount,
            balance: data.balance,
            winningLines,
            scatterCount,
            scatterPayout,
            awardedFreeSpins: data.awarded_free_spins,
            freeSpinCount: data.free_spin_count,
            inFreeSpin: data.in_free_spin || false, // на всякий случай
        };
    }

    private static mapBackendSymbol(backendSymbol: string): SymbolType {
        const symbolMap: Record<string, SymbolType> = {
            'S1': SymbolType.SYMBOL_1,
            'S2': SymbolType.SYMBOL_2,
            'S3': SymbolType.SYMBOL_3,
            'S4': SymbolType.SYMBOL_4,
            'S5': SymbolType.SYMBOL_5,
            'S6': SymbolType.SYMBOL_6,
            'S7': SymbolType.SYMBOL_7,
            'S8': SymbolType.SYMBOL_8,
            'B': SymbolType.BONUS,
            'W': SymbolType.WILD,
        };
        return symbolMap[backendSymbol] || SymbolType.SYMBOL_1;
    }

    private static convertBoardToReels(board: string[][]): Symbol[][] {
        return board.map((reel, reelIndex) =>
            reel.map((symbolStr, posIndex) => ({
                type: this.mapBackendSymbol(symbolStr),
                id: `${symbolStr}-${reelIndex}-${posIndex}-${Date.now()}`,
            }))
        );
    }

    private static convertWinningLinesFromAPI(apiLines: LineWinAPI[]): WinningLine[] {
        if (!apiLines || apiLines.length === 0) return [];

        return apiLines.map((line) => {
            const linePattern = PAYLINES.find(l => l.id === line.line);

            const positions: number[][] = [];
            if (linePattern && line.count > 0) {
                const maxCount = Math.min(line.count, linePattern.pattern.length);
                for (let i = 0; i < maxCount; i++) {
                    const row = linePattern.pattern[i];
                    if (row >= 0 && row <= 2) {
                        positions.push([i, row]);
                    }
                }
            }

            return {
                lineIndex: line.line,
                symbols: this.mapBackendSymbol(line.symbol),
                count: line.count,
                multiplier: 0,
                winAmount: line.payout,
                positions,
            };
        });
    }

    private static handleError(error: unknown): Error {
        if (error instanceof AxiosError) {
            const errorData = error.response?.data as ErrorResponse;
            return new Error(errorData?.error || error.message || 'Произошла ошибка');
        }
        return new Error('Неизвестная ошибка');
    }
}