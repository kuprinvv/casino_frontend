import { create } from 'zustand';
import { GameState, Symbol, SymbolType } from '@shared/types/game';
import { GAME_CONFIG } from '@shared/config/payouts';
import { GameAPI, UserAPI } from '@shared/api';

interface GameStore extends GameState {
    spin: () => void;
    setBet: (bet: number) => void;
    buyBonus: () => Promise<void>;
    reset: () => void;
    updateReels: (reels: Symbol[][]) => void;
    deposit: (amount: number) => Promise<void>;
    syncBalance: () => Promise<void>;
    useOnlineMode: boolean;
    setOnlineMode: (online: boolean) => void;
    isTurbo: boolean;
    setTurbo: (turbo: boolean) => void;
}

const createInitialReels = () => {
    const makeSymbol = (type: SymbolType, reelIdx: number, rowIdx: number): Symbol => ({
        type,
        id: `init-${reelIdx}-${rowIdx}`,
    });

    const staticReelsData: SymbolType[][] = [
        [SymbolType.SYMBOL_1, SymbolType.SYMBOL_5, SymbolType.SYMBOL_3],
        [SymbolType.SYMBOL_7, SymbolType.SYMBOL_2, SymbolType.SYMBOL_6],
        [SymbolType.SYMBOL_4, SymbolType.SYMBOL_8, SymbolType.SYMBOL_1],
        [SymbolType.SYMBOL_6, SymbolType.SYMBOL_3, SymbolType.SYMBOL_7],
        [SymbolType.SYMBOL_2, SymbolType.SYMBOL_4, SymbolType.SYMBOL_8],
    ];

    return staticReelsData.map((types, reelIndex) => ({
        symbols: types.map((type, rowIndex) => makeSymbol(type, reelIndex, rowIndex)),
        position: reelIndex,
    }));
};

const initialState: GameState = {
    reels: createInitialReels(),
    balance: GAME_CONFIG.DEFAULT_BALANCE,
    bet: GAME_CONFIG.DEFAULT_BET,
    isSpinning: false,
    isBonusGame: false,
    freeSpinsLeft: 0,
    lastWin: 0,
    totalWin: 0,
    winningLines: [],
};

export const useGameStore = create<GameStore>((set, get) => ({
    ...initialState,
    useOnlineMode: false,
    isTurbo: false,

    setTurbo: (turbo: boolean) => set({ isTurbo: turbo }),

    setOnlineMode: (online: boolean) => set({ useOnlineMode: online }),

    syncBalance: async () => {
        const state = get();
        if (!state.useOnlineMode) return;

        try {
            const data = await GameAPI.getData();
            set({
                balance: data.balance,
                freeSpinsLeft: data.free_spin_count,
            });
        } catch (error) {
            console.error('Failed to sync data:', error);
        }
    },

    deposit: async (amount: number) => {
        const state = get();

        if (state.useOnlineMode) {
            try {
                await UserAPI.deposit(amount);
                await get().syncBalance();
            } catch (error) {
                alert(error instanceof Error ? error.message : 'Ошибка при пополнении баланса');
                throw error;
            }
        } else {
            set({ balance: state.balance + amount });
        }
    },

    spin: async () => {
        const state = get();

        if (state.isSpinning) return;

        if (!state.isBonusGame && state.balance < state.bet) {
            alert('Недостаточно средств!');
            return;
        }

        set({ isSpinning: true, winningLines: [], lastWin: 0 });

        const spinDuration = state.isTurbo ? 100 : GAME_CONFIG.SPIN_DURATION;

        try {
            const result = await GameAPI.spin(state.bet);

            setTimeout(() => {
                console.log('🎯 Setting game state from spin:', result.winningLines);

                const currentState = get();
                const newFreeSpinsLeft = currentState.freeSpinsLeft > 0
                    ? currentState.freeSpinsLeft - 1
                    : (result.freeSpinCount > 0 ? result.freeSpinCount : 0);

                set({
                    reels: result.reels.map((symbols, index) => ({
                        symbols,
                        position: index,
                    })),
                    lastWin: result.winAmount,
                    totalWin: currentState.totalWin + result.winAmount,
                    balance: result.balance,
                    winningLines: result.winningLines,
                    isSpinning: false,
                    freeSpinsLeft: newFreeSpinsLeft,
                    isBonusGame: newFreeSpinsLeft > 0 || result.inFreeSpin,
                });

                if (result.scatterCount >= 3) {
                    console.log(`Скаттеров: ${result.scatterCount}, выплата: ${result.scatterPayout}`);
                }
            }, spinDuration);
        } catch (error) {
            set({ isSpinning: false });
            alert(error instanceof Error ? error.message : 'Ошибка при спине');
        }
    },

    setBet: (bet: number) => {
        const state = get();
        if (state.isSpinning) return;

        const clampedBet = Math.max(
            GAME_CONFIG.MIN_BET,
            Math.min(GAME_CONFIG.MAX_BET, bet)
        );

        set({ bet: clampedBet });
    },

    buyBonus: async () => {
        const state = get();

        if (state.isSpinning || state.isBonusGame) return;

        const bonusCost = state.bet * 100;

        if (state.balance < bonusCost) {
            alert('Недостаточно средств для покупки бонуса!');
            return;
        }

        set({
            isSpinning: true,
            winningLines: [],
            lastWin: 0,
        });

        try {
            const result = await GameAPI.buyBonus(bonusCost);

            setTimeout(() => {
                const currentState = get();
                const newFreeSpinsLeft = result.freeSpinCount;

                set({
                    reels: result.reels.map((symbols, index) => ({
                        symbols,
                        position: index,
                    })),
                    lastWin: result.winAmount,
                    totalWin: currentState.totalWin + result.winAmount,
                    balance: result.balance,
                    winningLines: result.winningLines,
                    isSpinning: false,
                    freeSpinsLeft: newFreeSpinsLeft,
                    isBonusGame: newFreeSpinsLeft > 0,
                });

                if (result.scatterCount >= 3) {
                    console.log(`Бонусные скаттеры: ${result.scatterCount}, выплата: ${result.scatterPayout}`);
                }
            }, state.isTurbo ? 100 : GAME_CONFIG.SPIN_DURATION);
        } catch (error) {
            set({ isSpinning: false });
            alert(error instanceof Error ? error.message : 'Ошибка при покупке бонуса');
        }
    },

    reset: () => set(initialState),

    updateReels: (reels: Symbol[][]) => {
        set({
            reels: reels.map((symbols, index) => ({
                symbols,
                position: index,
            })),
        });
    },
}));