import React, { useEffect, useState, useRef } from 'react';
import './CasinoControlPanel.css';
import { InfoPanel } from "@widgets/InfoPanel";

export interface CasinoControlPanelProps {
    bet: number;
    balance: number;
    isSpinning: boolean;
    isResolving?: boolean;
    isBonusGame: boolean;
    freeSpinsLeft: number;
    isTurbo: boolean;
    onSpin: () => void;
    onBetIncrease: () => void;
    onBetDecrease: () => void;
    onTurboToggle: () => void;
    onBuyBonus: () => void;
    minBet?: number;
    maxBet?: number;
}

export const CasinoControlPanel: React.FC<CasinoControlPanelProps> = ({
    bet,
    balance,
    isSpinning,
    isResolving = false,
    isBonusGame,
    freeSpinsLeft,
    isTurbo,
    onSpin,
    onBetIncrease,
    onBetDecrease,
    onTurboToggle,
    onBuyBonus,
    minBet = 2,
    maxBet = 100,
}) => {
    const [isCooldown, setIsCooldown] = useState(false);
    const [isAutoSpin, setIsAutoSpin] = useState(false);
    const [bonusDelayActive, setBonusDelayActive] = useState(false);

    const cooldownRef = useRef(false);
    const prevBonusGameRef = useRef(isBonusGame);
    // 🔧 Новый ref для отслеживания источника автоспина
    const autoSpinByBonusRef = useRef(false);

    // 🎯 Управление автоспином при входе/выходе из бонусной игры
    useEffect(() => {
        // Вход в бонус
        if (isBonusGame && !prevBonusGameRef.current) {
            setIsAutoSpin(true);
            setBonusDelayActive(true);
            autoSpinByBonusRef.current = true;

            const delayTimer = setTimeout(() => {
                setBonusDelayActive(false);
            }, 6500);

            return () => clearTimeout(delayTimer);
        }

        // Выход из бонуса
        if (!isBonusGame && prevBonusGameRef.current) {
            setIsAutoSpin(false);
            setBonusDelayActive(false); // ⚠️ Принудительно сбрасываем задержку
            autoSpinByBonusRef.current = false; // Сбрасываем флаг источника
        }

        prevBonusGameRef.current = isBonusGame;
    }, [isBonusGame]);

    // 🎯 Выключаем автоспин, если кончились фриспины
    useEffect(() => {
        if (isBonusGame && freeSpinsLeft === 0) {
            setIsAutoSpin(false);
            autoSpinByBonusRef.current = false;
        }
    }, [isBonusGame, freeSpinsLeft]);

    // 🎯 Основная логика авто-спина с защитой от race condition
    useEffect(() => {
        if (!isAutoSpin) return;

        // 🛡️ Safety check: если вышли из бонуса, но флаг ещё не сбросился — выключаем
        if (!isBonusGame && autoSpinByBonusRef.current) {
            setIsAutoSpin(false);
            autoSpinByBonusRef.current = false;
            return;
        }

        if (isSpinning || isResolving || isCooldown || bonusDelayActive) return;

        if (balance < bet && !isBonusGame) {
            setIsAutoSpin(false);
            return;
        }

        cooldownRef.current = true;
        setIsCooldown(true);
        onSpin();
    }, [isAutoSpin, isSpinning, isResolving, isCooldown, bonusDelayActive, balance, bet, isBonusGame, onSpin]);

    // 🎯 Кулдаун между спинами
    useEffect(() => {
        if (!isSpinning && !isResolving) {
            const cooldownTime = isTurbo ? 1000 : 2500;
            cooldownRef.current = true;
            setIsCooldown(true);

            const timer = setTimeout(() => {
                cooldownRef.current = false;
                setIsCooldown(false);
            }, cooldownTime);

            return () => clearTimeout(timer);
        }
    }, [isSpinning, isResolving, isTurbo]);

    // 🎯 Обработка пробела для спина
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (cooldownRef.current || isSpinning || isResolving) return;
            if (!((balance >= bet) || isBonusGame)) return;

            if (e.code === 'Space') {
                e.preventDefault();
                cooldownRef.current = true;
                setIsCooldown(true);
                onSpin();

                setTimeout(() => {
                    cooldownRef.current = false;
                    setIsCooldown(false);
                }, 2000);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [onSpin, isSpinning, isResolving, balance, bet, isBonusGame]);

    const toggleAutoSpin = () => {
        setIsAutoSpin(prev => {
            const next = !prev;
            if (!next && bonusDelayActive) {
                setBonusDelayActive(false);
            }
            // Если пользователь вручную выключает — сбрасываем флаг бонуса
            if (!next) {
                autoSpinByBonusRef.current = false;
            }
            return next;
        });
    };

    const handleSpin = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!((balance >= bet) || isBonusGame) || isSpinning || isResolving || isCooldown) {
            return;
        }

        // Ручной спин во время автоспина — выключаем автоспин
        if (isAutoSpin) {
            setIsAutoSpin(false);
            autoSpinByBonusRef.current = false;
        }

        cooldownRef.current = true;
        setIsCooldown(true);
        e.currentTarget.blur();
        window.scrollTo(window.scrollX, window.scrollY);
        onSpin();
    };

    const canSpin = (balance >= bet || isBonusGame) && !isSpinning && !isResolving && !isCooldown;
    const canBuyBonus = balance >= bet * 100 && !isBonusGame && !isSpinning && !isResolving;
    const canDecreaseBet = bet > minBet && !isSpinning && !isResolving && !isBonusGame;
    const canIncreaseBet = bet < maxBet && !isSpinning && !isResolving && !isBonusGame;

    return (
        <div className="casino-control-panel">
            <InfoPanel />

            <button
                type="button"
                className="casino-button bet-decrease"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.blur();
                    onBetDecrease();
                }}
                onMouseDown={(e) => e.preventDefault()}
                disabled={!canDecreaseBet}
                title={isBonusGame ? 'Нельзя изменить ставку во время бонусной игры' : 'Уменьшить ставку'}
            >
                –
            </button>

            <div className="bet-display">
                <span className="bet-label">Ставка</span>
                <span className="bet-value">{bet}</span>
            </div>

            <button
                type="button"
                className="casino-button bet-increase"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.blur();
                    onBetIncrease();
                }}
                onMouseDown={(e) => e.preventDefault()}
                disabled={!canIncreaseBet}
                title={isBonusGame ? 'Нельзя изменить ставку во время бонусной игры' : 'Увеличить ставку'}
            >
                +
            </button>

            <button
                type="button"
                className="casino-button spin-button"
                onClick={handleSpin}
                onMouseDown={(e) => {
                    if (!canSpin || cooldownRef.current) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.blur();
                }}
                onTouchStart={(e: React.TouchEvent<HTMLButtonElement>) => {
                    if (!canSpin || cooldownRef.current) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }
                }}
                onFocus={(e: React.FocusEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    e.currentTarget.blur();
                }}
                disabled={!canSpin}
                title={
                    isSpinning
                        ? 'Вращение...'
                        : isResolving
                        ? 'Каскад...'
                        : isBonusGame
                        ? `Фриспин (${freeSpinsLeft})`
                        : isCooldown
                        ? 'Подождите...'
                        : 'Крутить'
                }
            >
                <span className="button-label">
                    {isBonusGame ? `FREE (${freeSpinsLeft})` : <img src="/play.png" alt="play" />}
                </span>
            </button>

            <button
                type="button"
                className={`casino-button auto-spin-button ${isAutoSpin ? 'active' : ''}`}
                onClick={toggleAutoSpin}
                onMouseDown={(e) => e.preventDefault()}
                disabled={isBonusGame}
                title={
                    isBonusGame
                        ? 'Автоспин активен во время бонусной игры'
                        : isAutoSpin
                        ? 'Остановить автопрокрутку'
                        : balance < bet
                        ? `Недостаточно средств (требуется ${bet})`
                        : 'Запустить автопрокрутку'
                }
            >
                <img src="/auto.png" alt="Авто" />
                <span className="button-label">Авто</span>
            </button>

            <button
                type="button"
                className={`casino-button turbo-button ${isTurbo ? 'active' : ''}`}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.blur();
                    onTurboToggle();
                }}
                onMouseDown={(e) => e.preventDefault()}
                disabled={isSpinning || isResolving}
                title={isTurbo ? 'Турбо режим включен' : 'Включить турбо режим'}
            >
                <img src="/turbo2.png" alt="Турбо" />
                <span className="button-label">Турбо</span>
            </button>

            <button
                type="button"
                className="casino-button bonus-button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.blur();
                    onBuyBonus();
                }}
                onMouseDown={(e) => e.preventDefault()}
                disabled={!canBuyBonus}
                title={`Купить бонус за ${bet * 100}`}
            >
                <img src="/bonus-btn2.png" alt="Бонус" />
                <span className="button-label">Бонус</span>
            </button>
        </div>
    );
};