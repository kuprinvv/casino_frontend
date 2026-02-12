import React, { useState, useEffect, useMemo } from 'react';
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

// Создаем статические символы для прокрутки для каждого барабана
// Используем фиксированный паттерн на основе индекса барабана
const createStaticSpinningSymbols = (count: number, reelIndex: number): Symbol[] => {
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

    // Фиксированный паттерн для каждого барабана (без рандома!)
    return Array.from({ length: count }, (_, i) => {
        // Используем формулу с простыми числами для уникального распределения
        const typeIndex = (i * 7 + reelIndex * 13) % types.length;

        return {
            type: types[typeIndex],
            id: `spinning-${reelIndex}-${i}`,
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

    // Создаем статические символы ОДИН РАЗ при монтировании
    const staticSpinningSymbols = useMemo(
        () => createStaticSpinningSymbols(9, reelIndex),
        [reelIndex]
    );

    useEffect(() => {
        if (!symbols || symbols.length === 0) {
            return;
        }

        if (isSpinning) {
            setIsAnimating(true);
            // Используем статические символы вместо генерации новых
            setDisplaySymbols([...staticSpinningSymbols, ...symbols]);
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
    }, [isSpinning, symbols, reelIndex, isTurbo, staticSpinningSymbols]);

    return (
        <div className="reel-container">
            <SpinningOverlay isActive={isAnimating} />
            <div
                className={`reel ${isAnimating ? 'reel-spinning' : ''} ${isTurbo && isAnimating ? 'turbo' : ''}`}
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