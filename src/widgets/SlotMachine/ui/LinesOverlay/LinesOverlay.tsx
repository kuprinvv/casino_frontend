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
            >
                <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FFD700" />
                        <stop offset="25%" stopColor="#FFA500" />
                        <stop offset="50%" stopColor="#FFD700" />
                        <stop offset="75%" stopColor="#FFA500" />
                        <stop offset="100%" stopColor="#FFD700" />
                    </linearGradient>

                    <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FFF8DC" />
                        <stop offset="50%" stopColor="#FFD700" />
                        <stop offset="100%" stopColor="#FFF8DC" />
                    </linearGradient>

                    <filter id="royalGlow" x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="0.05" result="blur" />
                        <feFlood floodColor="#FFD700" floodOpacity="0.6" result="glowColor" />
                        <feComposite in="glowColor" in2="blur" operator="in" result="softGlow" />
                        <feMerge>
                            <feMergeNode in="softGlow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <path
                    d={linePath}
                    className="line-shadow"
                    fill="none"
                />

                <path
                    d={linePath}
                    className="winning-line"
                    stroke="url(#goldGradient)"
                    fill="none"
                    filter="url(#royalGlow)"
                />

                <path
                    d={linePath}
                    className="winning-line-inner"
                    stroke="url(#glowGradient)"
                    fill="none"
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