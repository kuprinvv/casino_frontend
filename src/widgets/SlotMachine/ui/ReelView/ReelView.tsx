// Обновленный ReelView.tsx с JS-анимацией прокрутки (вдохновлено старой логикой из main.js)
// Добавлена логика ускорения, рандомизации символов, easing при остановке
// Используем requestAnimationFrame для плавности, вместо CSS infinite animation
// Для easing при остановке - простая реализация backOut (можно добавить GSAP для лучшего эффекта)

import React, { useState, useEffect, useRef } from 'react';
import { Symbol, SymbolType } from '@shared/types/game';
import { SymbolView } from '../SymbolView/SymbolView';
import { SpinningOverlay } from './SpinningOverlay';
import './ReelView.css'; // Сохраняем стили, но удалим keyframes spin-reel, так как теперь JS

interface ReelViewProps {
    symbols: Symbol[];
    isSpinning: boolean;
    winningPositions?: number[];
    reelIndex: number;
    isTurbo?: boolean;
}

// Константы из старой игры (адаптированные под ваш дизайн)
const SYMBOL_HEIGHT = 75; // Высота символа (из ваших стилей, адаптируйте для мобильных)
const SYMBOL_GAP = 12; // Gap между символами
const NUM_VISIBLE_SYMBOLS = 3; // Видимых символов
const EXTRA_SYMBOLS = 20; // Дополнительные для спина (как в вашей версии)
const REEL_MAX_SPEED = 50; // Максимальная скорость (пиксели за кадр)
const REEL_ACC = 1; // Ускорение
const MIN_REEL_LOOPS = 10; // Минимальные циклы прокрутки
const TIME_RESET = 10; // Для рандомизации символов
const TIME_END_STOP_REEL = 500; // Время замедления
const TIME_OFFSET_STOP_REEL = 200; // Задержка между рилами
const BOUNCE_DURATION = 800; // Длительность bounce при остановке
const BOUNCE_AMPLITUDE = 8; // Амплитуда bounce

// Символы для рандомизации (из вашей SYMBOL_LABELS)
const RANDOM_SYMBOL_TYPES = [
    SymbolType.SYMBOL_1,
    SymbolType.SYMBOL_2,
    SymbolType.SYMBOL_3,
    SymbolType.SYMBOL_4,
    SymbolType.SYMBOL_5,
    SymbolType.SYMBOL_6,
    SymbolType.SYMBOL_7,
    SymbolType.SYMBOL_8,
];

const createRandomSymbol = (): Symbol => ({
    type: RANDOM_SYMBOL_TYPES[Math.floor(Math.random() * RANDOM_SYMBOL_TYPES.length)],
    id: `spinning-${Math.random()}`,
});

export const ReelView: React.FC<ReelViewProps> = ({
                                                      symbols,
                                                      isSpinning,
                                                      winningPositions = [],
                                                      reelIndex,
                                                      isTurbo = false,
                                                  }) => {
    const [displaySymbols, setDisplaySymbols] = useState<Symbol[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [yPosition, setYPosition] = useState(0);
    const reelRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>(0);
    const curSpeedRef = useRef(0);
    const curReelLoopsRef = useRef(0);
    const timeElapsedRef = useRef(0);
    const nextSymbolAttachRef = useRef(0);
    const timeEndWaitRef = useRef(0);
    const isStoppingRef = useRef(false);
    const bounceStartTimeRef = useRef(0);

    // Функция для обновления позиции (translateY)
    const updatePosition = (newY: number) => {
        if (reelRef.current) {
            reelRef.current.style.transform = `translateY(${newY}px)`;
        }
        setYPosition(newY);
    };

    // Анимационный цикл (RAF)
    const animate = (timestamp: number) => {
        if (!isAnimating) return;

        const deltaTime = 16; // Примерно 60fps

        if (isStoppingRef.current) {
            // Easing bounce при остановке
            if (!bounceStartTimeRef.current) bounceStartTimeRef.current = timestamp;
            const progress = (timestamp - bounceStartTimeRef.current) / BOUNCE_DURATION;
            if (progress >= 1) {
                updatePosition(0);
                setIsAnimating(false);
                setDisplaySymbols(symbols);
                return;
            }

            // Простой backOut easing для bounce (как в старой: cubic-bezier(0.3, 0.1, 0.3, 1))
            const bounce = BOUNCE_AMPLITUDE * (Math.sin(progress * Math.PI * 2) * (1 - progress));
            updatePosition(bounce);
        } else {
            // Прокрутка с ускорением
            timeElapsedRef.current += deltaTime;

            if (timeElapsedRef.current > TIME_RESET) {
                timeElapsedRef.current = 0;
                nextSymbolAttachRef.current--;
                if (nextSymbolAttachRef.current < 0) {
                    nextSymbolAttachRef.current = Math.random() > 0.5 ? 2 : 3;
                    // Рандомизация нижнего символа (последний в displaySymbols)
                    const newSymbols = [...displaySymbols];
                    newSymbols[newSymbols.length - 1] = createRandomSymbol();
                    setDisplaySymbols(newSymbols);
                }
            }

            curSpeedRef.current += REEL_ACC;
            if (curSpeedRef.current > REEL_MAX_SPEED) curSpeedRef.current = REEL_MAX_SPEED;

            const moveAmount = curSpeedRef.current * (isTurbo ? 2 : 1); // Ускорить в турбо
            let newY = yPosition + moveAmount;

            // Циклический сдвиг символов, если нижний ушёл за экран
            // const totalHeight = (SYMBOL_HEIGHT + SYMBOL_GAP) * NUM_VISIBLE_SYMBOLS;
            if (newY >= (SYMBOL_HEIGHT + SYMBOL_GAP)) {
                // Сдвиг: удалить верхний символ, добавить новый снизу
                const newSymbols = displaySymbols.slice(1);
                newSymbols.push(createRandomSymbol());
                setDisplaySymbols(newSymbols);
                newY -= (SYMBOL_HEIGHT + SYMBOL_GAP);
                curReelLoopsRef.current++;
            }

            updatePosition(newY);

            // Проверка на остановку
            if (curReelLoopsRef.current >= MIN_REEL_LOOPS && timeEndWaitRef.current <= 0) {
                isStoppingRef.current = true;
                bounceStartTimeRef.current = 0; // Сброс для bounce
            } else {
                timeEndWaitRef.current -= deltaTime;
            }
        }

        animationRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        if (!symbols || symbols.length === 0) return;

        if (isSpinning) {
            setIsAnimating(true);
            // Инициализация спина (как в старой startRolling)
            curSpeedRef.current = 2; // Начальная скорость
            curReelLoopsRef.current = Math.floor(Math.random() * (MIN_REEL_LOOPS / 2)) + MIN_REEL_LOOPS;
            nextSymbolAttachRef.current = Math.random() > 0.5 ? 2 : 3;
            timeEndWaitRef.current = (TIME_END_STOP_REEL + reelIndex * TIME_OFFSET_STOP_REEL) * (isTurbo ? 0.5 : 1);
            timeElapsedRef.current = 0;
            isStoppingRef.current = false;
            bounceStartTimeRef.current = 0;

            // Создать начальные символы для спина
            const spinSymbols = Array.from({ length: EXTRA_SYMBOLS }, createRandomSymbol);
            setDisplaySymbols([...spinSymbols, ...symbols]); // Добавляем финальные в конец
            updatePosition(0);

            animationRef.current = requestAnimationFrame(animate);
        } else {
            // Задержка остановки (как в вашей версии)
            const stopDelay = isTurbo ? 0 : reelIndex * 200;
            const timer = setTimeout(() => {
                isStoppingRef.current = true;
            }, stopDelay);

            return () => clearTimeout(timer);
        }

        return () => cancelAnimationFrame(animationRef.current);
    }, [isSpinning, symbols, reelIndex, isTurbo]);

    return (
        <div className="reel-container">
            <SpinningOverlay isActive={isAnimating} />
            <div
                ref={reelRef}
                className={`reel ${isAnimating ? 'reel-spinning' : ''} ${isTurbo && isAnimating ? 'turbo' : ''}`}
                style={{
                    animationDelay: `${reelIndex * 0.1}s`, // Каскадный запуск (сохраняем)
                }}
            >
                {displaySymbols.map((symbol, index) => (
                    <div key={symbol.id} className="reel-symbol">
                        <SymbolView
                            type={symbol.type}
                            isWinning={!isAnimating && winningPositions.includes(index % NUM_VISIBLE_SYMBOLS)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};