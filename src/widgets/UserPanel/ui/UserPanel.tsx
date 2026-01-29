import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@features/auth';
import { useGameStore } from '@entities/game';
import { AuthModal } from '@features/auth';
import styles from './UserPanel.module.css';


export const UserPanel: React.FC = () => {
  const [depositAmount, setDepositAmount] = useState('100');
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  
  const { user, isAuthenticated, logout } = useAuthStore();
  const { useOnlineMode, setOnlineMode, syncBalance, deposit } = useGameStore();

  useEffect(() => {
    if (isAuthenticated) {
      setOnlineMode(true);
      syncBalance();
    }
  }, [isAuthenticated, setOnlineMode, syncBalance]);

  const handleLogout = () => {
    logout();
    setOnlineMode(false);
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Введите корректную сумму');
      return;
    }

    try {
      await deposit(amount);
      setShowDepositForm(false);
      setDepositAmount('100');
    } catch (error) {
      console.error('Deposit error:', error);
    }
  };

  return (
    <>
      <div className={styles["user-panel"]}>
        {isAuthenticated && user ? (
          <div className={styles["user-info"]}>
            <div className={styles["user-email"]}>{user.name}</div>
            <div className={styles["user-actions"]}>
              {useOnlineMode && (
                <button
                  className={styles["btn-deposit"]}
                  onClick={() => setShowDepositForm(!showDepositForm)}
                >
                  💰 Пополнить
                </button>
              )}
              <button className={styles["btn-logout"]} onClick={handleLogout}>
                Выйти
              </button>
            </div>
          </div>
        ) : (
          <div className={styles["btn-log-reg"]}>
              <button className={styles["btn-login"]} onClick={() =>
                  setAuthMode("login")}>
                  Войти
              </button>
              <button className={styles["btn-register"]} onClick={() =>
                  setAuthMode("register")}>
                  Зарегистрироваться
              </button>
          </div>
        )}
      </div>

      {showDepositForm && (
        <div className={styles["deposit-form"]}>
          <h3>Пополнение баланса</h3>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Сумма"
            min="1"
            step="1"
          />
          <div className={styles["deposit-actions"]}>
            <button className={styles["btn-confirm"]} onClick={handleDeposit}>
              Пополнить
            </button>
            <button className={styles["btn-cancel"]} onClick={() => setShowDepositForm(false)}>
              Отмена
            </button>
          </div>
        </div>
      )}

        {authMode && (
            <AuthModal
                initialMode={authMode}
                onClose={() => setAuthMode(null)}
            />
        )}
    </>
  );
};

