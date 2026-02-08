import React from 'react';
import { SymbolType } from '@shared/types/game';
import './SymbolView.css';

interface SymbolViewProps {
  type: SymbolType;
  isWinning?: boolean;
}

const SYMBOL_COLORS: Record<SymbolType, string> = {
  [SymbolType.SYMBOL_1]: '#FF6B6B',
  [SymbolType.SYMBOL_2]: '#4ECDC4',
  [SymbolType.SYMBOL_3]: '#45B7D1',
  [SymbolType.SYMBOL_4]: '#FFA07A',
  [SymbolType.SYMBOL_5]: '#98D8C8',
  [SymbolType.SYMBOL_6]: '#F7B731',
  [SymbolType.SYMBOL_7]: '#5F27CD',
  [SymbolType.SYMBOL_8]: '#FF6348',
  [SymbolType.BONUS]: '#FFD700',
  [SymbolType.WILD]: '#00D2FF',
};

const SYMBOL_LABELS: Record<SymbolType, string> = {
  [SymbolType.SYMBOL_1]: '/public/1.png',
  [SymbolType.SYMBOL_2]: '/public/2.png',
  [SymbolType.SYMBOL_3]: '/public/4.png',
  [SymbolType.SYMBOL_4]: '/public/6.png',
  [SymbolType.SYMBOL_5]: '/public/7.png',
  [SymbolType.SYMBOL_6]: '/public/8.png',
  [SymbolType.SYMBOL_7]: '/public/9.png',
  [SymbolType.SYMBOL_8]: '/public/3.png',
  [SymbolType.BONUS]: '/public/5.png',
  [SymbolType.WILD]: 'W',
};

export const SymbolView: React.FC<SymbolViewProps> = ({ type, isWinning = false }) => {
  const backgroundColor = SYMBOL_COLORS[type];
  const label = SYMBOL_LABELS[type];

  return (
    <div
      className={`symbol ${isWinning ? 'symbol-winning' : ''}`}
      style={{ backgroundColor }}
    >
      <span className="symbol-label">{label}</span>
    </div>
  );
};

