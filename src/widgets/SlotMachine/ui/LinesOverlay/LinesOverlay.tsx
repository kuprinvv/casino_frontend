import React, { useState, useEffect, useMemo } from 'react';
import { WinningLine, SymbolType } from '@shared/types/game';
import './LinesOverlay.css';

interface LinesOverlayProps {
    winningLines: WinningLine[];
}

const REELS_COUNT = 5;
const ROWS_COUNT = 3;

// Генерирует путь в относительных координатах (сетка 5x3)
// Центр первой ячейки: x=0.5, y=0.5
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

    // Сброс индекса при новом спине
    useEffect(() => {
        setCurrentLineIndex(0);
    }, [winningLines]);

    // Анимация переключения линий
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
            <div className="lines-overlay">
                <div className="lines-counter">
                    <span className="lines-label">Выигрышных линий:</span>
                    <span className="lines-count">{winningLines.length}</span>
                </div>
            </div>
        );
    }

    if (!currentLine || !linePath) return null;

    return (
        <>
            {/*
                viewBox="0 0 5 3" задает логическую сетку координат.
                width/height 100% растягивают SVG на весь контейнер.
            */}
            <svg
                className="winning-lines-svg"
                viewBox={`0 0 ${REELS_COUNT} ${ROWS_COUNT}`}
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#64C8FF" />
                        <stop offset="50%" stopColor="#9B7FFF" />
                        <stop offset="100%" stopColor="#FF6B9D" />
                    </linearGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="0.05" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Тень линии */}
                <path
                    d={linePath}
                    className="line-shadow"
                    fill="none"
                />

                {/* Основная линия */}
                <path
                    d={linePath}
                    className="winning-line"
                    stroke="url(#lineGradient)"
                    fill="none"
                    filter="url(#glow)"
                />

                {/* Эффект пунктира/бегающей линии */}
                <path
                    d={linePath}
                    className="winning-line-glow"
                    fill="none"
                />

                {/* Точки на барабанах (опционально) */}
                {currentLine.positions.map(([reel, row], idx) => (
                    <circle
                        key={idx}
                        cx={reel + 0.5}
                        cy={row + 0.5}
                        r="0.15"
                        fill="#fff"
                        stroke="#FF6B9D"
                        strokeWidth="0.05"
                    />
                ))}
            </svg>

            <div className="lines-overlay-info">
                <div className="lines-counter">
                    <span className="lines-label">Линия:</span>
                    <span className="lines-count">{currentLine.lineIndex + 1}</span>
                </div>
                {filteredLines.length > 1 && (
                    <div className="line-indicator">
                        <span className="line-win">+{currentLine.winAmount}</span>
                    </div>
                )}
            </div>
        </>
    );
};