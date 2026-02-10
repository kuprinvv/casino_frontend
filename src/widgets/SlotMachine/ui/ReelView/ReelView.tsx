import React, { useState, useEffect, useRef } from 'react';
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

const SYMBOL_TYPES: SymbolType[] = [
    SymbolType.SYMBOL_1,
    SymbolType.SYMBOL_2,
    SymbolType.SYMBOL_3,
    SymbolType.SYMBOL_4,
    SymbolType.SYMBOL_5,
    SymbolType.SYMBOL_6,
    SymbolType.SYMBOL_7,
    SymbolType.SYMBOL_8,
    SymbolType.BONUS,
    SymbolType.WILD,
];

export const ReelView: React.FC<ReelViewProps> = ({
                                                      symbols,
                                                      isSpinning,
                                                      winningPositions = [],
                                                      reelIndex,
                                                      isTurbo = false,
                                                  }) => {
    const [displaySymbols, setDisplaySymbols] = useState<Symbol[]>([]);
    const [offset, setOffset] = useState(0);
    const rafRef = useRef<number | null>(null);
    const stateRef = useRef({
        velocity: 0,
        time: 0,
        phase: 'stopped' as 'stopped' | 'accelerating' | 'constant' | 'decelerating',
    });

    const symbolHeight = 68 + 12; // высота символа + gap — подгони под свой дизайн
    const visibleCount = 4;       // сколько символов видно одновременно
    const buffer = 6;             // буфер сверху и снизу

    // Генерация циклических символов
    const generateLoopSymbols = () => {
        const arr: Symbol[] = [];
        for (let i = 0; i < visibleCount + buffer * 2; i++) {
            arr.push({
                type: SYMBOL_TYPES[i % SYMBOL_TYPES.length],
                id: `loop-${reelIndex}-${i}`,
            });
        }
        return arr;
    };

    useEffect(() => {
        if (isSpinning) {
            setDisplaySymbols(generateLoopSymbols());
            stateRef.current = {
                velocity: 0,
                time: 0,
                phase: 'accelerating',
            };

            const startTime = performance.now();

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const dt = (currentTime - stateRef.current.time) / 1000;
                stateRef.current.time = currentTime;

                let { velocity, phase } = stateRef.current;

                // Фазы движения (по аналогии с видео)
                if (phase === 'accelerating') {
                    velocity += 45 * dt;           // ускорение
                    if (velocity > (isTurbo ? 65 : 38)) {
                        velocity = isTurbo ? 65 : 38;
                        stateRef.current.phase = 'constant';
                    }
                } else if (phase === 'constant') {
                    // стабильная скорость 1.5–2.5 секунды
                    if (elapsed > (isTurbo ? 800 : 1800)) {
                        stateRef.current.phase = 'decelerating';
                    }
                } else if (phase === 'decelerating') {
                    velocity *= 0.965;             // плавное торможение
                    if (velocity < 0.8) {
                        velocity = 0;
                        stateRef.current.phase = 'stopped';
                    }
                }

                // Движение вниз
                setOffset((prev) => {
                    let next = prev - velocity;
                    // Циклический сдвиг
                    if (Math.abs(next) > symbolHeight * displaySymbols.length) {
                        next += symbolHeight * displaySymbols.length;
                    }
                    return next;
                });

                stateRef.current.velocity = velocity;

                if (velocity > 0 || phase !== 'stopped') {
                    rafRef.current = requestAnimationFrame(animate);
                } else {
                    // Финальная остановка с небольшим отскоком
                    setOffset(0);
                    setDisplaySymbols(symbols);
                }
            };

            rafRef.current = requestAnimationFrame(animate);

            // Задержка остановки для stagger-эффекта
            const stopDelay = isTurbo ? 0 : reelIndex * 250 + 300;
            const timer = setTimeout(() => {
                stateRef.current.phase = 'decelerating';
            }, stopDelay);

            return () => {
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
                clearTimeout(timer);
            };
        } else {
            setOffset(0);
            setDisplaySymbols(symbols);
            stateRef.current.phase = 'stopped';
        }
    }, [isSpinning, symbols, reelIndex, isTurbo, displaySymbols.length]);

    return (
        <div className="reel-container">
            <SpinningOverlay isActive={isSpinning} />
            <div
                className="reel"
                style={{
                    transform: `translateY(${offset}px)`,
                    willChange: 'transform',
                }}
            >
                {displaySymbols.map((symbol, idx) => (
                    <div key={symbol.id} className="reel-symbol">
                        <SymbolView
                            type={symbol.type}
                            isWinning={!isSpinning && winningPositions.includes(idx % symbols.length)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};