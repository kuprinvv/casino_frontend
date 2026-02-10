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
    const [isAnimating, setIsAnimating] = useState(false);
    const [hasBounce, setHasBounce] = useState(false);
    const [finalSymbols, setFinalSymbols] = useState<Symbol[] | null>(null);
    const [showFinalOverlay, setShowFinalOverlay] = useState(false);
    const rafRef = useRef<number | null>(null);
    const stateRef = useRef({
        velocity: 0,
        phase: 'stopped' as 'stopped' | 'accelerating' | 'cruising' | 'decelerating',
        startTime: 0,
        lastTime: 0,
        targetOffset: 0,
    });
    const offsetRef = useRef(0);

    const symbolHeight = 75 + 12; // высота символа (75px) + gap (12px) — держим в синхроне с CSS
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
            setIsAnimating(true);
            setHasBounce(false);
            setFinalSymbols(null);
            setShowFinalOverlay(false);

            const startTime = performance.now();
            stateRef.current = {
                velocity: 0,
                phase: 'accelerating',
                startTime,
                lastTime: startTime,
                targetOffset: 0,
            };

            const animate = (now: number) => {
                const elapsed = now - stateRef.current.startTime;
                const dt = (now - stateRef.current.lastTime) / 1000 || 0.016; // реальный дельта-тайм кадра
                stateRef.current.lastTime = now;

                let { velocity, phase } = stateRef.current;

                // Фазы как в хороших слотах (ускорили вращение)
                if (phase === 'accelerating') {
                    velocity += 110 * dt; // более резкое ускорение
                    if (velocity > (isTurbo ? 130 : 70)) {
                        velocity = isTurbo ? 130 : 70;
                        stateRef.current.phase = 'cruising';
                    }
                } else if (phase === 'cruising') {
                    if (elapsed > (isTurbo ? 600 : 1500)) { // короче время стабильного вращения
                        stateRef.current.phase = 'decelerating';
                    }
                } else if (phase === 'decelerating') {
                    velocity *= 0.95; // быстрее тормозим
                    if (velocity < 1.2) {
                        velocity = 0;
                        stateRef.current.phase = 'stopped';
                    }
                }

                // Смещение текущей ленты вниз
                setOffset(prev => {
                    const next = prev - velocity;
                    offsetRef.current = next;
                    return next;
                });

                stateRef.current.velocity = velocity;

                if (velocity > 0 || phase !== 'stopped') {
                    rafRef.current = requestAnimationFrame(animate);
                } else {
                    // Финальный лёгкий отскок без резкой смены символов
                    setHasBounce(true);
                    setOffset(prev => prev + (isTurbo ? 4 : 8));

                    requestAnimationFrame(() => {
                        setOffset(prev => prev - (isTurbo ? 4 : 8));
                    });

                    // отключаем класс отскока чуть позже, чтобы не мешал следующему спину
                    setTimeout(() => setHasBounce(false), 260);
                    setIsAnimating(false);
                }
            };

            rafRef.current = requestAnimationFrame(animate);

            // Stagger остановки барабанов
            const stopAfter = isTurbo ? 0 : reelIndex * 200 + 300; // барабаны останавливаются быстрее
            const stopTimer = setTimeout(() => {
                stateRef.current.phase = 'decelerating';
            }, stopAfter);

            return () => {
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
                clearTimeout(stopTimer);
                setIsAnimating(false);
                setHasBounce(false);
            };
        } else {
            // Спин завершился, сервер прислал финальные символы —
            // аккуратно показываем их поверх текущей ленты без "телепорта"
            stateRef.current.phase = 'stopped';
            setIsAnimating(false);
            setHasBounce(false);
            setFinalSymbols(symbols);
            requestAnimationFrame(() => setShowFinalOverlay(true));
        }
    }, [isSpinning, symbols, reelIndex, isTurbo]);

    const reelClassName = [
        'reel',
        isAnimating ? 'reel-spinning' : '',
        hasBounce ? 'reel-stop-bounce' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className="reel-container">
            <SpinningOverlay isActive={isSpinning} />
            <div
                className={reelClassName}
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
            {finalSymbols && (
                <div
                    className={
                        'reel-final-overlay' +
                        (showFinalOverlay ? ' reel-final-overlay-visible' : '')
                    }
                >
                    {finalSymbols.map((symbol, idx) => (
                        <div key={`final-${symbol.id}-${idx}`} className="reel-symbol">
                            <SymbolView
                                type={symbol.type}
                                isWinning={!isSpinning && winningPositions.includes(idx)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};