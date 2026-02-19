import React, { useState, useEffect, useMemo } from 'react';
import { WinningLine, SymbolType } from '@shared/types/game';
import './LinesOverlay.css';

interface LinesOverlayProps {
    winningLines: WinningLine[];
}

const REELS_COUNT = 5;
const ROWS_COUNT = 3;

const generateRelativePath = (positions: number[][]): string => {
    if (!positions || positions.length === 0) return '';

    const points = positions
        .filter(pos => pos && pos.length >= 2)
        .map(([reelIndex, rowIndex]) => {
            if (reelIndex < 0 || reelIndex >= REELS_COUNT || rowIndex < 0 || rowIndex >= ROWS_COUNT) {
                return null;
            }
            return {
                x: reelIndex + 0.5,
                y: rowIndex + 0.5
            };
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

    const filteredLines = useMemo(() => {
        return winningLines.filter(line =>
            line.lineIndex !== -1 && line.symbols !== SymbolType.BONUS
        );
    }, [winningLines]);

    useEffect(() => {
        setCurrentLineIndex(0);
    }, [winningLines]);

    useEffect(() => {
        if (filteredLines.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentLineIndex((prev) => (prev + 1) % filteredLines.length);
        }, 1500);
        return () => clearInterval(interval);
    }, [filteredLines.length]);

    const currentLine = filteredLines.length > 0 ? filteredLines[currentLineIndex] : null;

    const linePath = useMemo(() => {
        return currentLine ? generateRelativePath(currentLine.positions) : '';
    }, [currentLine]);

    if (filteredLines.length === 0) {
        if (winningLines.length === 0) return null;
        return (
            <div className="lines-overlay-container">
                <div className="lines-top-info">
                    <div className="royal-badge">
                        <span className="badge-label">Выигрышных линий:</span>
                        <span className="badge-count">{winningLines.length}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentLine || !linePath) return null;

    return (
        <div className="lines-overlay-container">
            <div className="lines-top-info">
                <div className="royal-badge">
                    <span className="badge-label">Линия:</span>
                    <span className="badge-count">{currentLine.lineIndex + 1}</span>
                </div>
            </div>

            <svg
                className="winning-lines-svg"
                viewBox={`0 0 ${REELS_COUNT} ${ROWS_COUNT}`}
                preserveAspectRatio="none"
                style={{ overflow: 'visible' }}
            >
                <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FFD700" />
                        <stop offset="25%" stopColor="#FFA500" />
                        <stop offset="50%" stopColor="#FFD700" />
                        <stop offset="75%" stopColor="#FFA500" />
                        <stop offset="100%" stopColor="#FFD700" />
                    </linearGradient>
                </defs>

                {/* Тень для контраста */}
                <path
                    d={linePath}
                    stroke="rgba(0, 0, 0, 0.6)"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    style={{ filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.5))' }}
                />

                {/* Основная линия с анимацией */}
                <path
                    d={linePath}
                    stroke="url(#goldGradient)"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    shapeRendering="geometricPrecision"
                    className="winning-line-path"
                />

                {/* Белый блик по центру */}
                <path
                    d={linePath}
                    stroke="#FFF8DC"
                    strokeWidth="1"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    opacity="0.9"
                />
            </svg>

            <div className="lines-bottom-info">
                {filteredLines.length > 1 && (
                    <div className="win-amount-badge">
                        <span className="win-amount">+{currentLine.winAmount}</span>
                    </div>
                )}
            </div>
        </div>
    );
};