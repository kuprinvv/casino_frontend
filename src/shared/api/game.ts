import { apiClient } from './client';
import {SpinRequest, SpinApiResponse, BuyBonusRequest} from './types';
import { AxiosError } from 'axios';
import { Symbol, SymbolType, WinningLine } from '@shared/types/game';
import { PAYLINES } from '@shared/config/lines';

export class GameAPI {
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
            const response = await apiClient.getClient().post<SpinApiResponse>('/line/spin', data);

            console.log('🎰 Spin RAW response:', JSON.stringify(response.data, null, 2));

            if (!response.data?.board) {
                throw new Error('Invalid API response: board is missing');
            }

            const reels = this.convertBoardToReels(response.data.board);
            const winAmount = response.data.total_payout;
            const balance = response.data.balance;
            const winningLines = this.convertWinningLinesFromAPI(response.data.line_wins || []);

            console.log('🎰 Spin result from API:', {
                board: response.data.board,
                lineWins: response.data.line_wins,
                winningLines: winningLines,
                totalPayout: winAmount,
            });

            if (response.data.scatter_count >= 3 && response.data.scatter_payout > 0) {
                const scatterPositions: number[][] = [];
                response.data.board.forEach((reel: string[], reelIndex: number) => {
                    reel.forEach((symbol: string, rowIndex: number) => {
                        if (symbol === 'B') {
                            scatterPositions.push([reelIndex, rowIndex]);
                        }
                    });
                });

                winningLines.push({
                    lineIndex: -1,
                    symbols: SymbolType.BONUS,
                    count: response.data.scatter_count,
                    multiplier: 0,
                    winAmount: response.data.scatter_payout,
                    positions: scatterPositions,
                });
            }

            const inFreeSpin = response.data.free_spin_count > 0;

            return {
                reels,
                winAmount,
                balance,
                winningLines,
                scatterCount: response.data.scatter_count,
                scatterPayout: response.data.scatter_payout,
                awardedFreeSpins: response.data.awarded_free_spins,
                freeSpinCount: response.data.free_spin_count,
                inFreeSpin,
            };
        } catch (error) {
            throw this.handleError(error);
        }
    }

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
            const response = await apiClient.getClient().post<SpinApiResponse>('/line/buy-bonus', data);

            console.log('🎁 BuyBonus RAW response:', JSON.stringify(response.data, null, 2));

            if (!response.data?.board) {
                throw new Error('Invalid API response: board is missing');
            }

            const reels = this.convertBoardToReels(response.data.board);
            const winningLines = this.convertWinningLinesFromAPI(response.data.line_wins || []);

            if (response.data.scatter_count >= 3 && response.data.scatter_payout > 0) {
                const scatterPositions: number[][] = [];
                response.data.board.forEach((reel, reelIndex) => {
                    reel.forEach((symbol, rowIndex) => {
                        if (symbol === 'B') {
                            scatterPositions.push([reelIndex, rowIndex]);
                        }
                    });
                });
                winningLines.push({
                    lineIndex: -1,
                    symbols: SymbolType.BONUS,
                    count: response.data.scatter_count,
                    multiplier: 0,
                    winAmount: response.data.scatter_payout,
                    positions: scatterPositions,
                });
            }

            return {
                reels,
                winAmount: response.data.total_payout,
                balance: response.data.balance,
                winningLines,
                scatterCount: response.data.scatter_count,
                scatterPayout: response.data.scatter_payout,
                awardedFreeSpins: response.data.awarded_free_spins,
                freeSpinCount: response.data.free_spin_count,
                inFreeSpin: true,
            };
        } catch (error) {
            throw this.handleError(error);
        }
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
        if (!board || !Array.isArray(board)) {
            console.error('❌ Invalid board format:', board);
            return [[], [], [], [], []];
        }

        return board.map((reel, reelIndex) =>
            reel.map((symbolStr, posIndex) => {
                const mappedType = this.mapBackendSymbol(symbolStr);
                return {
                    type: mappedType,
                    id: `${mappedType}-${reelIndex}-${posIndex}-${Date.now()}`,
                };
            })
        );
    }

    private static convertWinningLinesFromAPI(apiLines: any[] | undefined): WinningLine[] {
        if (!apiLines || apiLines.length === 0) return [];

        return apiLines.map((line) => {
            const linePattern = PAYLINES.find(l => l.id === line.line);

            const positions: number[][] = [];
            if (linePattern && line.count > 0) {
                const maxCount = Math.min(line.count, linePattern.pattern.length);
                for (let reelIndex = 0; reelIndex < maxCount; reelIndex++) {
                    const rowIndex = linePattern.pattern[reelIndex];
                    if (rowIndex >= 0 && rowIndex <= 2 && reelIndex >= 0 && reelIndex < 5) {
                        positions.push([reelIndex, rowIndex]);
                    }
                }
            }

            if (line.line === 3) {
                console.log('🎯 Line 3 conversion:', {
                    apiLine: line,
                    linePattern: linePattern,
                    positions: positions,
                    count: line.count
                });
            }

            return {
                lineIndex: line.line,
                symbols: this.mapBackendSymbol(line.symbol),
                count: line.count,
                multiplier: 0,
                winAmount: line.payout,
                positions: positions,
            };
        });
    }

    private static handleError(error: unknown): Error {
        if (error instanceof AxiosError) {
            const errorData = error.response?.data as any;

            console.error('🔥 API Error Details:', {
                url: error.config?.url,
                method: error.config?.method,
                status: error.response?.status,
                statusText: error.response?.statusText,
                rawData: errorData,
                message: error.message,
            });

            const errorMsg =
                typeof errorData === 'string'
                    ? errorData
                    : errorData?.error
                    || errorData?.message
                    || errorData?.msg
                    || errorData?.details
                    || error.response?.statusText
                    || error.message
                    || 'Произошла ошибка';

            return new Error(errorMsg);
        }

        console.error('🔥 Unknown error:', error);
        return new Error(error instanceof Error ? error.message : 'Неизвестная ошибка');
    }
}