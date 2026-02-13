import React, {useEffect, useState} from 'react';
import './CasinoControlPanel.css';
import {InfoPanel} from "@widgets/InfoPanel";

export interface CasinoControlPanelProps {
  // Game state
  bet: number;
  balance: number;
  isSpinning: boolean;
  isResolving?: boolean; // Для cascade игры
  isBonusGame: boolean;
  freeSpinsLeft: number;
  isTurbo: boolean;
  
  // Actions
  onSpin: () => void;
  onBetIncrease: () => void;
  onBetDecrease: () => void;
  onTurboToggle: () => void;
  onBuyBonus: () => void;
  
  // Configuration
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
  // Привязка к пробелу
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpinning && !isResolving && !isCooldown && (balance >= bet || isBonusGame)) {
        e.preventDefault();
        onSpin();
        setIsCooldown(true);
        setTimeout(() => setIsCooldown(false), 3000);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onSpin, isSpinning, isResolving, isCooldown, balance, bet, isBonusGame]);

    useEffect(() => {
        if (!isSpinning && !isResolving) {
            setIsCooldown(true);
            const cooldownTime =  isTurbo ? 1000 : 2000;
            const timer = setTimeout(() => setIsCooldown(false), cooldownTime);
            return () => clearTimeout(timer);
        }
    }, [isSpinning, isResolving, isTurbo]);

  const canSpin = (balance >= bet || isBonusGame) && !isSpinning && !isResolving && !isCooldown;
  const canBuyBonus = balance >= bet * 100 && !isBonusGame && !isSpinning && !isResolving;
  const canDecreaseBet = bet > minBet && !isSpinning && !isResolving && !isBonusGame;
  const canIncreaseBet = bet < maxBet && !isSpinning && !isResolving && !isBonusGame;

    // Обработчик спина с защитой
    const handleSpin = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!canSpin) {
            return;
        }
        e.currentTarget.blur();
        window.scrollTo(window.scrollX, window.scrollY);
        onSpin();
        setIsCooldown(true);
    };

  return (
    <div className="casino-control-panel">
      {/* Кнопка уменьшения ставки */}
        <InfoPanel/>
      <button
        type="button"
        className="casino-button bet-decrease"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.blur();
          onBetDecrease();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        disabled={!canDecreaseBet}
        title={isBonusGame ? 'Нельзя изменить ставку во время бонусной игры' : 'Уменьшить ставку'}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Отображение ставки */}
      <div className="bet-display">
        <span className="bet-label">Ставка</span>
        <span className="bet-value">{bet}</span>
      </div>

      {/* Кнопка увеличения ставки */}
      <button
        type="button"
        className="casino-button bet-increase"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.blur();
          onBetIncrease();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        disabled={!canIncreaseBet}
        title={isBonusGame ? 'Нельзя изменить ставку во время бонусной игры' : 'Увеличить ставку'}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Кнопка спина */}
      <button
        type="button"
        className="casino-button spin-button"
        onClick={handleSpin}
        onMouseDown={(e) => {
          if (!canSpin) {
              e.preventDefault();
              e.stopPropagation();
              return;
          }
          // Предотвращаем фокус при нажатии мыши
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.blur();
        }}
        onTouchStart={(e: React.TouchEvent<HTMLButtonElement>) => {
            // Для мобильных устройств
            if (!canSpin) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
        }}
        onFocus={(e: React.FocusEvent<HTMLButtonElement>) => {
          // Предотвращаем скролл при получении фокуса
          e.preventDefault();
          e.currentTarget.blur();
        }}
        disabled={!canSpin}
        title={isSpinning ? 'Вращение...' : isResolving ? 'Каскад...' : isBonusGame ? `Фриспин (${freeSpinsLeft})` : isCooldown ? 'Подождите...' : 'Крутить'}
      >
          <span className="button-label">{isBonusGame ? `FREE (${freeSpinsLeft + 1})` :
              <img width="30" height="30" src="https://img.icons8.com/ios-filled/50/FFFFFF/play.png" alt="play"/>}</span>
      </button>

      {/* Кнопка турбо */}
      <button
        type="button"
        className={`casino-button turbo-button ${isTurbo ? 'active' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.blur();
          onTurboToggle();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        disabled={isSpinning || isResolving}
        title={isTurbo ? 'Турбо режим включен' : 'Включить турбо режим'}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="button-label">Турбо</span>
      </button>

      {/* Кнопка покупки бонуса */}
      <button
        type="button"
        className="casino-button bonus-button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.blur();
          onBuyBonus();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        disabled={!canBuyBonus}
        title={`Купить бонус за ${bet * 100}`}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="8" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 8V4M12 4L9 7M12 4L15 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="14" r="2" fill="currentColor"/>
        </svg>
        <span className="button-label">Бонус</span>
      </button>
    </div>
  );
};

