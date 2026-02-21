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
    const [autoSpinDisabled, setAutoSpinDisabled] = useState(false);

    const cooldownRef = useRef(false);
    const prevBonusGameRef = useRef(isBonusGame);
    const justExitedBonusRef = useRef(false);

    useEffect(() => {
        if (isBonusGame && !prevBonusGameRef.current) {
            setIsAutoSpin(true);
            setBonusDelayActive(true);
            setAutoSpinDisabled(true);

            const delayTimer = setTimeout(() => {
                setBonusDelayActive(false);
            }, 6500);

            return () => clearTimeout(delayTimer);
        }

        if (!isBonusGame && prevBonusGameRef.current) {
            justExitedBonusRef.current = true;
            setIsAutoSpin(false);
            setAutoSpinDisabled(true);

            const unlockTimer = setTimeout(() => {
                justExitedBonusRef.current = false;
                setAutoSpinDisabled(false);
            }, 3000);

            return () => clearTimeout(unlockTimer);
        }

        prevBonusGameRef.current = isBonusGame;
    }, [isBonusGame]);

    useEffect(() => {
        if (isBonusGame && freeSpinsLeft === 0) {
            setIsAutoSpin(false);
        }
    }, [isBonusGame, freeSpinsLeft]);

    useEffect(() => {
        if (!isAutoSpin) return;
        if (justExitedBonusRef.current) return;
        if (isSpinning || isResolving || isCooldown || bonusDelayActive) return;

        if (balance < bet && !isBonusGame) {
            setIsAutoSpin(false);
            return;
        }

        cooldownRef.current = true;
        setIsCooldown(true);
        onSpin();
    }, [isAutoSpin, isSpinning, isResolving, isCooldown, bonusDelayActive, balance, bet, isBonusGame, onSpin]);

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
        if (autoSpinDisabled) return;

        setIsAutoSpin(prev => {
            const next = !prev;
            if (!next && bonusDelayActive) {
                setBonusDelayActive(false);
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

        if (isAutoSpin) {
            setIsAutoSpin(false);
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
    const canAutoSpin = !autoSpinDisabled && !isSpinning && !isResolving;

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
                disabled={!canAutoSpin}
                title={
                    autoSpinDisabled
                        ? 'Автопрокрутка недоступна после бонусной игры'
                        : isAutoSpin
                            ? 'Остановить автопрокрутку'
                            : balance < bet && !isBonusGame
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