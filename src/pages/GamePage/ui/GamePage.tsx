import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SlotMachine } from '@widgets/SlotMachine';
import { CasinoControlPanel } from '@widgets/CasinoControlPanel';
import { PaytableModal } from '@widgets/PaytableModal';
import { BonusActivationAnimation } from '@widgets/BonusActivationAnimation';
import { Button } from '@shared/ui/Button';
import { useGameStore } from '@entities/game';
import styles from './GamePage.module.css';

export const GamePage: React.FC = () => {
    const navigate = useNavigate();
    const [isPaytableOpen, setIsPaytableOpen] = useState(false);
    const [showBonusOverlay, setShowBonusOverlay] = useState(false);
    const {
        bet,
        balance,
        isSpinning,
        isBonusGame,
        freeSpinsLeft,
        isTurbo,
        spin,
        setBet,
        buyBonus,
        setTurbo,
    } = useGameStore();

    const mountedRef = useRef(false);
    const prevFreeSpinsRef = useRef(freeSpinsLeft);

    useEffect(() => {
        // При входе на страницу игры
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';

        // При уходе со страницы игры — возвращаем скролл
        return () => {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        };
    }, []);

    useEffect(() => {
        if (!mountedRef.current) {
            mountedRef.current = true;
            prevFreeSpinsRef.current = freeSpinsLeft;
            return;
        }

        if (prevFreeSpinsRef.current === 0 && freeSpinsLeft > 0 && isBonusGame) {
            setShowBonusOverlay(true);
            const t = window.setTimeout(() => setShowBonusOverlay(false), 6000);
            prevFreeSpinsRef.current = freeSpinsLeft;
            return () => window.clearTimeout(t);
        }

        prevFreeSpinsRef.current = freeSpinsLeft;
    }, [freeSpinsLeft, isBonusGame]);

    const handleBetIncrease = () => {
        setBet(bet + 2);
    };

    const handleBetDecrease = () => {
        setBet(bet - 2);
    };

    return (
        <div className={styles["game-page"]}>
            <BonusActivationAnimation show={showBonusOverlay} text="БОНУСНАЯ ИГРА" />
            <header className={styles["game-header"]}>
                <Button
                    onClick={() => navigate('/')}
                    variant="secondary"
                    className={styles["back-menu-button"]}
                >
                    ← В меню
                </Button>
                <h1 className={styles["game-title"]}>🎰 Слот Машина 🎰</h1>
                <Button
                    onClick={() => setIsPaytableOpen(true)}
                    variant="secondary"
                    className={styles["info-button"]}
                >
                    📊 Таблица выплат
                </Button>
            </header>

            <main className={styles["game-content"]}>
                <SlotMachine />
                <CasinoControlPanel
                    bet={bet}
                    balance={balance}
                    isSpinning={isSpinning}
                    isBonusGame={isBonusGame}
                    freeSpinsLeft={freeSpinsLeft}
                    isTurbo={isTurbo}
                    onSpin={spin}
                    onBetIncrease={handleBetIncrease}
                    onBetDecrease={handleBetDecrease}
                    onTurboToggle={() => setTurbo(!isTurbo)}
                    onBuyBonus={buyBonus}
                    minBet={2}
                    maxBet={100}
                />
            </main>

            <PaytableModal
                isOpen={isPaytableOpen}
                onClose={() => setIsPaytableOpen(false)}
            />
        </div>
    );
};