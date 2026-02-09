import React from 'react';
import { SymbolType } from '@shared/types/game';
import { PAYOUTS } from '@shared/config/payouts';
import './PaytableModal.css';

interface PaytableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaytableModal: React.FC<PaytableModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const symbols = [
    { type: SymbolType.SYMBOL_8, label: '/1.png', name: 'Король' },
    { type: SymbolType.SYMBOL_7, label: '/2.png', name: 'Королева' },
    { type: SymbolType.SYMBOL_6, label: '/3.png', name: 'Корона' },
    { type: SymbolType.SYMBOL_5, label: '/4.png', name: 'Жезл' },
    { type: SymbolType.SYMBOL_4, label: '/6.png', name: 'Знамя' },
    { type: SymbolType.SYMBOL_3, label: '/7.png', name: 'Герб' },
    { type: SymbolType.SYMBOL_2, label: '/8.png', name: 'Перстень' },
    { type: SymbolType.SYMBOL_1, label: '/9.png', name: 'Факел' },
    { type: SymbolType.BONUS, label: '/5.png', name: 'Бонус' },
    { type: SymbolType.WILD, label: '/wild.png', name: 'Wild' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2 className="modal-title">📊 Таблица выплат</h2>
        
        <div className="paytable">
          {symbols.map(({ type, label, name }) => {
            const payout = PAYOUTS[type];
            if (!payout) return null;

            return (
              <div key={type} className="paytable-row">
                <div className="paytable-symbol">
                    <img src={label} width={"50px"} alt="Элемент"/>
                  <span className="paytable-name">{name}</span>
                </div>
                <div className="paytable-values">
                  {payout.x2 && <span>x2: {payout.x2}x</span>}
                  <span>x3: {payout.x3}x</span>
                  <span>x4: {payout.x4}x</span>
                  <span>x5: {payout.x5}x</span>
                </div>
              </div>
            );
          })}
                <div key={SymbolType.BONUS} className="paytable-row">
                    <div className="paytable-symbol">
                        <img src={'/5.png'} width={"50px"} alt="Элемент"/>
                        <span className="paytable-name">Бонус</span>
                    </div>
                    <div className="paytable-values">
                        <span>x3: BONUS GAME</span>
                    </div>
                </div>
            <div key={SymbolType.WILD} className="paytable-row">
                <div className="paytable-symbol">
                    <img src={'/wild.png'} width={"50px"} alt="Элемент"/>
                    <span className="paytable-name">Wild</span>
                </div>
                <div className="paytable-values">
                    <span>Универсальный символ</span>
                </div>
            </div>
        </div>

        <div className="rules">
          <h3>📜 Правила:</h3>
          <ul>
            <li>Минимум 3 одинаковых символа для выигрыша</li>
            <li>Комбинации считаются слева направо</li>
            <li>Wild (W) заменяет любой символ кроме бонусного</li>
            <li>Wild выпадает на барабанах 2, 3, 4 и расширяется вертикально</li>
            <li>3+ бонусных символа запускают бесплатные спины</li>
            <li>В бонусной игре гарантирован Wild в каждом спине</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

