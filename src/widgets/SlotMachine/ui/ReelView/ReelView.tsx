import React, { useState, useEffect } from 'react';
import { Symbol, SymbolType } from '@shared/types/game';
import { SymbolView } from '../SymbolView/SymbolView';
import { SpinningOverlay } from './SpinningOverlay';
import './ReelView.css';

interface ReelViewProps {
    symbols: Symbol[];
    isSpinning: boolean;
    winningPositions?: number[];
    reelIndex: number;
    isTurbo?: boolean;
}

// Создаем дополнительные символы для эффекта прокрутки
// Добавляем reelIndex для уникальности каждого барабана
const createSpinningSymbols = (count: number, reelIndex: number): Symbol[] => {
    const types = [
        SymbolType.SYMBOL_1,
        SymbolType.SYMBOL_2,
        SymbolType.SYMBOL_3,
        SymbolType.SYMBOL_4,
        SymbolType.SYMBOL_5,
        SymbolType.SYMBOL_6,
        SymbolType.SYMBOL_7,
        SymbolType.SYMBOL_8,
    ];

    // Используем reelIndex как seed для уникальности
    return Array.from({ length: count }, (_, i) => {
        // Генерируем случайный индекс с учетом reelIndex для уникальности
        const randomOffset = (reelIndex * 137 + i * 997) % types.length;
        const randomIndex = (Math.floor(Math.random() * types.length) + randomOffset) % types.length;

        return {
            type: types[randomIndex],
            id: `spinning-${reelIndex}-${i}-${Date.now()}-${Math.random()}`,
        };
    });
};

export const ReelView: React.FC<ReelViewProps> = ({
                                                      symbols,
                                                      isSpinning,
                                                      winningPositions = [],
                                                      reelIndex,
                                                      isTurbo = false,
                                                  }) => {
    const [displaySymbols, setDisplaySymbols] = useState<Symbol[]>(symbols || []);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (!symbols || symbols.length === 0) {
            return;
        }

        if (isSpinning) {
            setIsAnimating(true);
            // Передаем reelIndex для уникальных символов на каждом барабане
            const spinSymbols = createSpinningSymbols(9, reelIndex);
            setDisplaySymbols([...spinSymbols, ...symbols]);
        } else {
            // Задержка остановки для последовательной остановки слева направо
            // Турбо: 60мс между барабанами, Обычный: 300мс
            const stopDelay = isTurbo ? reelIndex * 60 : reelIndex * 300;

            const timer = setTimeout(() => {
                setIsAnimating(false);
                setDisplaySymbols(symbols);
            }, stopDelay);

            return () => clearTimeout(timer);
        }
    }, [isSpinning, symbols, reelIndex, isTurbo]);

    return (
        <div className="reel-container">
            <SpinningOverlay isActive={isAnimating} />
            <div
                className={`reel ${isAnimating ? 'reel-spinning' : ''} ${isTurbo && isAnimating ? 'turbo' : ''}`}
                // Убран animationDelay - он мешал последовательной остановке
            >
                {displaySymbols?.length > 0 && displaySymbols.map((symbol, index) => (
                    <div key={symbol.id} className="reel-symbol">
                        <SymbolView
                            type={symbol.type}
                            isWinning={!isAnimating && winningPositions.includes(index)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};