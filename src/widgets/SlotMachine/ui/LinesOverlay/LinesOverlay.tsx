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
    useMobileSizes: boolean = false
): { x: number; y: number } => {
    const reelWidth = useMobileSizes ? REEL_WIDTH_MOBILE : REEL_WIDTH;
    const reelGap = useMobileSizes ? REEL_GAP_MOBILE : REEL_GAP;
    const symbolHeight = useMobileSizes ? SYMBOL_HEIGHT_MOBILE : SYMBOL_HEIGHT;
    const symbolGap = useMobileSizes ? SYMBOL_GAP_MOBILE : SYMBOL_GAP;
    const padding = useMobileSizes ? REEL_PADDING_MOBILE : REEL_PADDING;

    const x = reelIndex * (reelWidth + reelGap) + reelWidth / 2;
    const y = padding + rowIndex * (symbolHeight + symbolGap) + symbolHeight / 2;

    return { x, y };
};

const generateLinePath = (
    positions: number[][],
    useMobileSizes: boolean = false
): string => {
    if (!positions || positions.length === 0) return '';

    const points = positions
        .filter(pos => pos && pos.length >= 2 && !isNaN(pos[0]) && !isNaN(pos[1]))
        .map(([reelIndex, rowIndex]) => {
            if (reelIndex < 0 || reelIndex >= REELS_COUNT || rowIndex < 0 || rowIndex >= ROWS_COUNT) {
                return null;
            }
            return getSymbolCenter(reelIndex, rowIndex, useMobileSizes);
        })
        .filter(point => point !== null) as { x: number; y: number }[];

    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
};

export const LinesOverlay: React.FC<LinesOverlayProps> = ({ winningLines }) => {
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [useMobileSizes, setUseMobileSizes] = useState(false);

    const filteredLines = useMemo(() => {
        return winningLines.filter(line =>
            line.lineIndex !== -1 && line.symbols !== SymbolType.BONUS
        );
    }, [winningLines]);

    useEffect(() => {
        const checkScreenSize = () => {
            const isNarrow = window.innerWidth <= 768;
            const isCompact = window.innerWidth <= 900 && window.innerHeight <= 500;
            setUseMobileSizes(isNarrow || isCompact);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    useEffect(() => {
        if (filteredLines.length === 0) {
            setCurrentLineIndex(0);
            return;
        }
        if (currentLineIndex >= filteredLines.length) {
            setCurrentLineIndex(0);
        }
    }, [filteredLines, currentLineIndex]);

    useEffect(() => {
        if (filteredLines.length === 0) return;

        const interval = setInterval(() => {
            setCurrentLineIndex((prev) => {
                if (filteredLines.length === 0) return 0;
                return (prev + 1) % filteredLines.length;
            });
        }, 1500);

        return () => clearInterval(interval);
    }, [filteredLines.length]);

    const svgDimensions = useMemo(() => {
        const reelWidth = useMobileSizes ? REEL_WIDTH_MOBILE : REEL_WIDTH;
        const reelGap = useMobileSizes ? REEL_GAP_MOBILE : REEL_GAP;
        const symbolHeight = useMobileSizes ? SYMBOL_HEIGHT_MOBILE : SYMBOL_HEIGHT;
        const symbolGap = useMobileSizes ? SYMBOL_GAP_MOBILE : SYMBOL_GAP;
        const padding = useMobileSizes ? REEL_PADDING_MOBILE : REEL_PADDING;

        const width = REELS_COUNT * reelWidth + (REELS_COUNT - 1) * reelGap;
        const height = ROWS_COUNT * symbolHeight + (ROWS_COUNT - 1) * symbolGap + 2 * padding;

        return { width, height };
    }, [useMobileSizes]);

    const currentLine = filteredLines.length > 0 ? filteredLines[currentLineIndex] : null;
    const linePath = currentLine ? generateLinePath(currentLine.positions, useMobileSizes) : '';

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

    if (!currentLine || !linePath || linePath.trim() === '' || currentLine.positions.length === 0) {
        return (
            <div className="lines-overlay">
                <div className="lines-counter">
                    <span className="lines-label">Выигрышных линий:</span>
                    <span className="lines-count">{winningLines.length}</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <svg
                className="winning-lines-svg"
                width={svgDimensions.width}
                height={svgDimensions.height}
            >
                <defs>
                    <linearGradient id={`lineGradient-${currentLine.lineIndex}`} x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#64C8FF" stopOpacity="1" />
                        <stop offset="30%" stopColor="#7DB8FF" stopOpacity="1" />
                        <stop offset="50%" stopColor="#9B7FFF" stopOpacity="1" />
                        <stop offset="70%" stopColor="#D18AFF" stopOpacity="1" />
                        <stop offset="100%" stopColor="#FF6B9D" stopOpacity="1" />
                    </linearGradient>
                    <linearGradient id={`lineGlowGradient-${currentLine.lineIndex}`} x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#B8E6FF" stopOpacity="1" />
                        <stop offset="30%" stopColor="#C8EDFF" stopOpacity="1" />
                        <stop offset="50%" stopColor="#C4B5FF" stopOpacity="1" />
                        <stop offset="70%" stopColor="#E0C5FF" stopOpacity="1" />
                        <stop offset="100%" stopColor="#FFB8D1" stopOpacity="1" />
                    </linearGradient>
                    <radialGradient id={`lineGlowRadial-${currentLine.lineIndex}`}>
                        <stop offset="0%" stopColor="rgba(100, 200, 255, 0.8)" />
                        <stop offset="50%" stopColor="rgba(155, 127, 255, 0.5)" />
                        <stop offset="100%" stopColor="rgba(255, 107, 157, 0.2)" />
                    </radialGradient>
                </defs>

                <path
                    d={linePath}
                    className="line-shadow"
                    strokeWidth={useMobileSizes ? 6 : 10}
                />
                <path
                    d={linePath}
                    className="winning-line"
                    strokeWidth={useMobileSizes ? 6 : 8}
                    stroke={`url(#lineGradient-${currentLine.lineIndex})`}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d={linePath}
                    className="winning-line-glow"
                    strokeWidth={useMobileSizes ? 4 : 5}
                    stroke={`url(#lineGlowGradient-${currentLine.lineIndex})`}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d={linePath}
                    className="winning-line-glow"
                    strokeWidth={useMobileSizes ? 3 : 4}
                    stroke={`url(#lineGlowGradient-${currentLine.lineIndex})`}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.6"
                    style={{ filter: 'blur(3px)' }}
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
                        {currentLine.lineIndex === -1 ? 'Бонус' : `Линия ${currentLine.lineIndex}`}
                    </span>
                    <span className="line-win">+{currentLine.winAmount}</span>
                </div>
            )}
        </>
    );
};