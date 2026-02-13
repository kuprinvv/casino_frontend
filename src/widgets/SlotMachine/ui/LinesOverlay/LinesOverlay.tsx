import React, { useState, useEffect, useMemo } from 'react';
import { WinningLine, SymbolType } from '@shared/types/game';
import './LinesOverlay.css';

interface LinesOverlayProps {
    winningLines: WinningLine[];
}

const REEL_WIDTH = 120;
const REEL_GAP = 12;
const SYMBOL_HEIGHT = 100;
const SYMBOL_GAP = 8;
const REEL_PADDING = 10;
const REELS_COUNT = 5;
const ROWS_COUNT = 3;

const REEL_WIDTH_MOBILE = 75;
const REEL_GAP_MOBILE = 8;
const SYMBOL_HEIGHT_MOBILE = 60;
const SYMBOL_GAP_MOBILE = 4;
const REEL_PADDING_MOBILE = 5;

const getSymbolCenter = (
    reelIndex: number,
    rowIndex: number,
    isMobile: boolean = false
): { x: number; y: number } => {
    const reelWidth = isMobile ? REEL_WIDTH_MOBILE : REEL_WIDTH;
    const reelGap = isMobile ? REEL_GAP_MOBILE : REEL_GAP;
    const symbolHeight = isMobile ? SYMBOL_HEIGHT_MOBILE : SYMBOL_HEIGHT;
    const symbolGap = isMobile ? SYMBOL_GAP_MOBILE : SYMBOL_GAP;
    const padding = isMobile ? REEL_PADDING_MOBILE : REEL_PADDING;

    const x = reelIndex * (reelWidth + reelGap) + reelWidth / 2;
    const y = padding + rowIndex * (symbolHeight + symbolGap) + symbolHeight / 2;

    return { x, y };
};

const generateLinePath = (
    positions: number[][],
    isMobile: boolean = false
): string => {
    if (!positions?.length) return '';

    const points = positions
        .filter(pos => pos && pos.length >= 2 && !isNaN(pos[0]) && !isNaN(pos[1]))
        .map(([reelIndex, rowIndex]) => {
            if (reelIndex < 0 || reelIndex >= REELS_COUNT || rowIndex < 0 || rowIndex >= ROWS_COUNT) {
                return null;
            }
            return getSymbolCenter(reelIndex, rowIndex, isMobile);
        })
        .filter((p): p is { x: number; y: number } => p !== null);

    if (points.length === 0) return '';
    if (points.length === 1) {
        return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;
    }

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
};

export const LinesOverlay: React.FC<LinesOverlayProps> = ({ winningLines }) => {
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    const filteredLines = useMemo(() => {
        return winningLines.filter(line => line.lineIndex !== -1 && line.symbols !== SymbolType.BONUS);
    }, [winningLines]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (filteredLines.length === 0) {
            setCurrentLineIndex(0);
            return;
        }
        if (currentLineIndex >= filteredLines.length) {
            setCurrentLineIndex(0);
        }
    }, [filteredLines]);

    useEffect(() => {
        if (filteredLines.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentLineIndex(prev => (prev + 1) % filteredLines.length);
        }, 2200); // ← увеличен интервал

        return () => clearInterval(interval);
    }, [filteredLines.length]);

    const svgDimensions = useMemo(() => {
        const reelWidth = isMobile ? REEL_WIDTH_MOBILE : REEL_WIDTH;
        const reelGap = isMobile ? REEL_GAP_MOBILE : REEL_GAP;
        const symbolHeight = isMobile ? SYMBOL_HEIGHT_MOBILE : SYMBOL_HEIGHT;
        const symbolGap = isMobile ? SYMBOL_GAP_MOBILE : SYMBOL_GAP;
        const padding = isMobile ? REEL_PADDING_MOBILE : REEL_PADDING;

        return {
            width: REELS_COUNT * reelWidth + (REELS_COUNT - 1) * reelGap,
            height: ROWS_COUNT * symbolHeight + (ROWS_COUNT - 1) * symbolGap + 2 * padding,
        };
    }, [isMobile]);

    const currentLine = filteredLines[currentLineIndex] ?? null;
    const linePath = currentLine ? generateLinePath(currentLine.positions, isMobile) : '';

    if (filteredLines.length === 0) {
        if (winningLines.length === 0) return null;
        return (
            <div className="lines-overlay">
                <div className="lines-counter">
                    <span className="lines-label">Выигрышных линий:</span>
                    <span className="lines-count">{winningLines.length}</span>
                </div>
            </div>
        );
    }

    if (!currentLine || !linePath) {
        return (
            <div className="lines-overlay">
                <div className="lines-counter">
                    <span className="lines-label">Выигрышных линий:</span>
                    <span className="lines-count">{winningLines.length}</span>
                </div>
            </div>
        );
    }

    const gradientId = `lineGradient-${currentLine.lineIndex}`;
    const glowId = `lineGlowGradient-${currentLine.lineIndex}`;

    return (
        <>
            <svg
                className="winning-lines-svg"
                width={svgDimensions.width}
                height={svgDimensions.height}
                shapeRendering="geometricPrecision"  // ← улучшает качество линий
            >
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#70D0FF" />
                        <stop offset="50%" stopColor="#A78BFA" />
                        <stop offset="100%" stopColor="#FF7EB3" />
                    </linearGradient>

                    <linearGradient id={glowId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#B8F0FF" />
                        <stop offset="50%" stopColor="#D5C4FF" />
                        <stop offset="100%" stopColor="#FFD1E0" />
                    </linearGradient>
                </defs>

                {/* Тень */}
                <path
                    d={linePath}
                    className="line-shadow"
                    strokeWidth={isMobile ? 10 : 14}
                />

                {/* Основная линия */}
                <path
                    d={linePath}
                    className="winning-line"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={isMobile ? 5 : 7}
                />

                {/* Свечение */}
                <path
                    d={linePath}
                    className="winning-line-glow"
                    stroke={`url(#${glowId})`}
                    strokeWidth={isMobile ? 10 : 14}
                />
            </svg>

            <div className="lines-overlay">
                <div className="lines-counter">
                    <span className="lines-label">Выигрышных линий:</span>
                    <span className="lines-count">{winningLines.length}</span>
                </div>
            </div>

            {filteredLines.length > 1 && (
                <div className="line-indicator">
                    <span className="line-number">
                        {currentLine.lineIndex === -1 ? 'Бонус' : `Линия ${currentLine.lineIndex + 1}`}
                    </span>
                    <span className="line-win">+{currentLine.winAmount}</span>
                </div>
            )}
        </>
    );
};