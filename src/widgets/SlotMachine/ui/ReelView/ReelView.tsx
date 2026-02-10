import React, { useState, useEffect, useRef } from 'react';
import { Symbol, SymbolType } from '@shared/types/game';
import { SymbolView } from '../SymbolView/SymbolView';
import { SpinningOverlay } from './SpinningOverlay';
import './ReelView.css';

interface ReelViewProps {
    symbols: Symbol[];                    // финальные символы от сервера (3 или 4 штуки)
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
        phase: 'stopped' as 'stopped' | 'accelerating' | 'cruising' | 'decelerating',
        startTime: 0,
        targetOffset: 0,
    });

    const symbolHeight = 68 + 12; // высота + gap — обязательно подгони под реальный размер!
    const bufferTop = 8;          // запас сверху — чтобы символы не "выпадали"

    // Предзагрузка всех возможных символов (один раз при монтировании)
    useEffect(() => {
        const paths = [
            '/1.png','/2.png','/3.png','/4.png','/6.png','/7.png','/8.png','/9.png',
            '/bonus.png','/wild.png'
        ];
        paths.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }, []);

    // Генерация ленты для спина
    const createSpinStrip = () => {
        const strip: Symbol[] = [];
        // Буфер сверху + видимые + буфер снизу
        for (let i = 0; i < bufferTop; i++) {
            strip.push({
                type: SYMBOL_TYPES[i % SYMBOL_TYPES.length],
                id: `pre-${reelIndex}-${i}`,
            });
        }
        // Добавляем несколько циклов случайных символов
        for (let i = 0; i < 5; i++) { // 5 циклов — достаточно для длинного спина
            strip.push(...SYMBOL_TYPES.map(type => ({
                type,
                id: `cycle-${reelIndex}-${i}-${type}`,
            })));
        }
        return strip;
    };

    useEffect(() => {
        if (isSpinning) {
            const strip = createSpinStrip();
            setDisplaySymbols(strip);
            stateRef.current = {
                velocity: 0,
                phase: 'accelerating',
                startTime: performance.now(),
                targetOffset: 0,
            };

            const animate = (now: number) => {
                const elapsed = now - stateRef.current.startTime;
                const dt = (now - stateRef.current.startTime - elapsed) / 1000 + 0.016; // ≈1/60

                let { velocity, phase } = stateRef.current;

                // Фазы как в хороших слотах
                if (phase === 'accelerating') {
                    velocity += 60 * dt; // сильное ускорение
                    if (velocity > (isTurbo ? 85 : 52)) {
                        velocity = isTurbo ? 85 : 52;
                        stateRef.current.phase = 'cruising';
                    }
                } else if (phase === 'cruising') {
                    if (elapsed > (isTurbo ? 900 : 2200)) { // время стабильного вращения
                        stateRef.current.phase = 'decelerating';
                    }
                } else if (phase === 'decelerating') {
                    velocity *= 0.962; // плавное торможение
                    if (velocity < 1.2) {
                        velocity = 0;
                        stateRef.current.phase = 'stopped';
                    }
                }

                setOffset(prev => prev - velocity);

                // Циклическое смещение (бесшовный скролл вниз)
                if (offset < -symbolHeight * bufferTop) {
                    setDisplaySymbols(prev => prev.slice(bufferTop));
                    setOffset(prev => prev + symbolHeight * bufferTop);
                }

                stateRef.current.velocity = velocity;

                if (velocity > 0 || phase !== 'stopped') {
                    rafRef.current = requestAnimationFrame(animate);
                } else {
                    // Финальная точная остановка на нужных символах
                    const finalOffset = -symbolHeight * bufferTop; // подгоняем под первые видимые = symbols
                    setOffset(finalOffset);
                    setDisplaySymbols(symbols);
                }
            };

            rafRef.current = requestAnimationFrame(animate);

            // Stagger остановки барабанов
            const stopAfter = isTurbo ? 0 : reelIndex * 280 + 400;
            const stopTimer = setTimeout(() => {
                stateRef.current.phase = 'decelerating';
            }, stopAfter);

            return () => {
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
                clearTimeout(stopTimer);
            };
        } else {
            setOffset(0);
            setDisplaySymbols(symbols);
            stateRef.current.phase = 'stopped';
        }
    }, [isSpinning, symbols, reelIndex, isTurbo]);

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
                            isWinning={!isSpinning && winningPositions.includes(idx)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};