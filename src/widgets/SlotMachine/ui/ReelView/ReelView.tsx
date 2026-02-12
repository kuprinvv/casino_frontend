import React, { useState, useEffect, useRef } from 'react';
import { Symbol, SymbolType } from '@shared/types/game';
import { SpinningOverlay } from './SpinningOverlay';
import './ReelView.css';

interface ReelViewProps {
    symbols: Symbol[];
    isSpinning: boolean;
    winningPositions?: number[];
    reelIndex: number;
    isTurbo?: boolean;
}

const SYMBOL_PATHS: Record<SymbolType, string> = {
    [SymbolType.SYMBOL_1]: '/9.png',
    [SymbolType.SYMBOL_2]: '/8.png',
    [SymbolType.SYMBOL_3]: '/7.png',
    [SymbolType.SYMBOL_4]: '/6.png',
    [SymbolType.SYMBOL_5]: '/4.png',
    [SymbolType.SYMBOL_6]: '/3.png',
    [SymbolType.SYMBOL_7]: '/2.png',
    [SymbolType.SYMBOL_8]: '/1.png',
    [SymbolType.BONUS]: '/bonus.png',
    [SymbolType.WILD]: '/wild.png',
};

const RANDOM_SYMBOL_TYPES = Object.keys(SYMBOL_PATHS)
    .map(Number)
    .map(n => n as unknown as SymbolType);

const SYMBOL_WIDTH = 75;
const SYMBOL_HEIGHT = 75;
const SYMBOL_GAP = 12;
const NUM_VISIBLE_SYMBOLS = 3;
const REEL_HEIGHT = SYMBOL_HEIGHT * NUM_VISIBLE_SYMBOLS + SYMBOL_GAP * (NUM_VISIBLE_SYMBOLS - 1);
const EXTRA_BUFFERS = 2;

const REEL_MAX_SPEED = 50;
const REEL_ACC = 1;
const MIN_REEL_LOOPS = 10;
const TIME_RESET = 10;
const TIME_END_STOP_REEL = 500;
const TIME_OFFSET_STOP_REEL = 200;
const EASE_DURATION = 800;

const backOut = (t: number) => {
    const s = 1.70158;
    return --t * t * ((s + 1) * t + s) + 1;
};

export const ReelView: React.FC<ReelViewProps> = ({
                                                      symbols,
                                                      isSpinning,
                                                      winningPositions = [],
                                                      reelIndex,
                                                      isTurbo = false,
                                                  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const animationRef = useRef<number>(0);
    const curSpeedRef = useRef(0);
    const curReelLoopsRef = useRef(0);
    const timeElapsedRef = useRef(0);
    const nextSymbolAttachRef = useRef(0);
    const timeEndWaitRef = useRef(0);
    const isStoppingRef = useRef(false);
    const easeStartTimeRef = useRef(0);

    const symbolImagesRef = useRef<Map<SymbolType, HTMLImageElement>>(new Map());
    const symbolPositionsRef = useRef<number[]>([]);
    const symbolTypesRef = useRef<SymbolType[]>([]);

    // Загрузка изображений
    useEffect(() => {
        Object.entries(SYMBOL_PATHS).forEach(([typeStr, src]) => {
            const type = Number(typeStr) as unknown as SymbolType;
            const img = new Image();
            img.src = src;
            img.onload = () => {
                symbolImagesRef.current.set(type, img);
            };
        });
    }, []);

    const initReel = () => {
        symbolPositionsRef.current = [];
        symbolTypesRef.current = [];
        for (let i = -EXTRA_BUFFERS; i < NUM_VISIBLE_SYMBOLS + EXTRA_BUFFERS; i++) {
            symbolPositionsRef.current.push(i * (SYMBOL_HEIGHT + SYMBOL_GAP));
            const randomIndex = Math.floor(Math.random() * RANDOM_SYMBOL_TYPES.length);
            symbolTypesRef.current.push(RANDOM_SYMBOL_TYPES[randomIndex] as unknown as SymbolType);
        }
    };

    const drawReel = (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, SYMBOL_WIDTH, REEL_HEIGHT);

        const blur = !isStoppingRef.current;
        const showGlow = !isAnimating;

        for (let i = 0; i < symbolPositionsRef.current.length; i++) {
            const y = symbolPositionsRef.current[i];
            if (y + SYMBOL_HEIGHT < 0 || y > REEL_HEIGHT) continue;

            const type = symbolTypesRef.current[i];
            const img = symbolImagesRef.current.get(type);
            if (!img) continue;

            ctx.filter = blur ? 'blur(3px) brightness(1.1)' : 'none';

            ctx.drawImage(img, 0, y, SYMBOL_WIDTH, SYMBOL_HEIGHT);

            if (showGlow && winningPositions.includes(i - EXTRA_BUFFERS)) {
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 30;
                ctx.drawImage(img, 0, y, SYMBOL_WIDTH, SYMBOL_HEIGHT);
                ctx.shadowBlur = 0;
            }
        }
    };

    const animate = (timestamp: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const deltaTime = 16;

        if (isStoppingRef.current) {
            if (easeStartTimeRef.current === 0) {
                easeStartTimeRef.current = timestamp;
            }

            const elapsed = timestamp - easeStartTimeRef.current;
            let progress = elapsed / EASE_DURATION;

            if (progress >= 1) {
                setIsAnimating(false);
                symbolTypesRef.current = symbols.map(s => s.type);
                symbolPositionsRef.current = symbols.map((_, i) => i * (SYMBOL_HEIGHT + SYMBOL_GAP));
                drawReel(ctx);
                return;
            }

            const eased = backOut(progress);
            const bounceOffset = (1 - eased) * 20;

            // Применяем смещение напрямую
            symbolPositionsRef.current = symbolPositionsRef.current.map(y => y + bounceOffset);
            drawReel(ctx);
        } else {
            timeElapsedRef.current += deltaTime;

            if (timeElapsedRef.current > TIME_RESET) {
                timeElapsedRef.current = 0;
                nextSymbolAttachRef.current--;
                if (nextSymbolAttachRef.current < 0) {
                    nextSymbolAttachRef.current = Math.random() > 0.5 ? 2 : 3;
                    const lastIndex = symbolTypesRef.current.length - 1;
                    const randomIndex = Math.floor(Math.random() * RANDOM_SYMBOL_TYPES.length);
                    symbolTypesRef.current[lastIndex] = RANDOM_SYMBOL_TYPES[randomIndex] as unknown as SymbolType;
                }
            }

            curSpeedRef.current = Math.min(curSpeedRef.current + REEL_ACC, REEL_MAX_SPEED);

            const moveAmount = curSpeedRef.current * (isTurbo ? 2 : 1);
            symbolPositionsRef.current = symbolPositionsRef.current.map(y => y + moveAmount);

            const symbolFullHeight = SYMBOL_HEIGHT + SYMBOL_GAP;

            while (symbolPositionsRef.current[0] > symbolFullHeight) {
                symbolPositionsRef.current.shift();
                symbolTypesRef.current.shift();

                const newY = symbolPositionsRef.current[symbolPositionsRef.current.length - 1] + symbolFullHeight;
                symbolPositionsRef.current.push(newY);

                const randomIndex = Math.floor(Math.random() * RANDOM_SYMBOL_TYPES.length);
                symbolTypesRef.current.push(RANDOM_SYMBOL_TYPES[randomIndex] as unknown as SymbolType);

                curReelLoopsRef.current++;
            }

            drawReel(ctx);

            timeEndWaitRef.current -= deltaTime;

            if (curReelLoopsRef.current >= MIN_REEL_LOOPS && timeEndWaitRef.current <= 0) {
                isStoppingRef.current = true;
                easeStartTimeRef.current = 0;
            }
        }

        animationRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        if (!symbols?.length) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        if (isSpinning) {
            setIsAnimating(true);
            initReel();

            curSpeedRef.current = 2;
            curReelLoopsRef.current = Math.floor(Math.random() * (MIN_REEL_LOOPS / 2)) + MIN_REEL_LOOPS;
            nextSymbolAttachRef.current = Math.random() > 0.5 ? 2 : 3;
            timeEndWaitRef.current = (TIME_END_STOP_REEL + reelIndex * TIME_OFFSET_STOP_REEL) * (isTurbo ? 0.5 : 1);
            timeElapsedRef.current = 0;
            isStoppingRef.current = false;
            easeStartTimeRef.current = 0;

            animationRef.current = requestAnimationFrame(animate);
        } else {
            const stopDelay = isTurbo ? 0 : reelIndex * 200;
            const timer = setTimeout(() => {
                isStoppingRef.current = true;
            }, stopDelay);

            return () => clearTimeout(timer);
        }

        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, [isSpinning, symbols, reelIndex, isTurbo, winningPositions]);

    return (
        <div className="reel-container">
            <SpinningOverlay isActive={isAnimating} />
            <canvas
                ref={canvasRef}
                width={SYMBOL_WIDTH}
                height={REEL_HEIGHT}
                style={{ display: 'block' }}
            />
        </div>
    );
};