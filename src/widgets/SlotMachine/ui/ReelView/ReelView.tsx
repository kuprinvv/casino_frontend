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

    return Array.from({ length: count }, (_, i) => {
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

    // Создаем статические символы ОДИН РАЗ
    const staticSpinningSymbols = useMemo(
        () => createStaticSpinningSymbols(15, reelIndex), // Увеличено до 15 для плавности
        [reelIndex]
    );

    useEffect(() => {
        if (!symbols || symbols.length === 0) {
            return;
        }

        if (isSpinning) {
            setIsAnimating(true);
            // Спин-символы ДО основных для движения вниз
            setDisplaySymbols([ ...symbols, ...staticSpinningSymbols]);
        } else {
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