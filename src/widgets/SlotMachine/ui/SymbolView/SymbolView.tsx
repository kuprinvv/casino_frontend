import React from 'react';
import { SymbolType } from '@shared/types/game';
import './SymbolView.css';

interface SymbolViewProps {
  type: SymbolType;
  isWinning?: boolean;
}


const SYMBOL_LABELS: Record<SymbolType, string> = {
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

export const SymbolView: React.FC<SymbolViewProps> = ({ type, isWinning = false }) => {
  const label = SYMBOL_LABELS[type];

  return (
      <div
          className={`symbol ${isWinning ? 'symbol-winning' : ''}`}
      >
          <img
              src={label}
              className="symbol-label"
              alt=""
              loading="eager"
              decoding="sync"
              fetchPriority="high"
          />
      </div>
  );
};

