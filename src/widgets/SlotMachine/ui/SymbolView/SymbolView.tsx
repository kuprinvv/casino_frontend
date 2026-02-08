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
  [SymbolType.SYMBOL_1]: '/1.png',
  [SymbolType.SYMBOL_2]: '/2.png',
  [SymbolType.SYMBOL_3]: '/4.png',
  [SymbolType.SYMBOL_4]: '/6.png',
  [SymbolType.SYMBOL_5]: '/7.png',
  [SymbolType.SYMBOL_6]: '/8.png',
  [SymbolType.SYMBOL_7]: '/9.png',
  [SymbolType.SYMBOL_8]: '/3.png',
  [SymbolType.BONUS]: '/5.png',
  [SymbolType.WILD]: '/w.png',
};

export const SymbolView: React.FC<SymbolViewProps> = ({ type, isWinning = false }) => {
  const backgroundColor = SYMBOL_COLORS[type];
  const label = SYMBOL_LABELS[type];

  return (
    <div
      className={`symbol ${isWinning ? 'symbol-winning' : ''}`}
      style={{ backgroundColor }}
    >
      <img src={label} className="symbol-label"></img>
    </div>
  );
};

