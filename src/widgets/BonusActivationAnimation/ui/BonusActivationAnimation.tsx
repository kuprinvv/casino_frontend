import React, { useEffect, useState, useRef } from 'react';
import './BonusActivationAnimation.css';

interface BonusActivationAnimationProps {
    show: boolean;
    text?: string;
    durationMs?: number;
    videoSrc?: string; // Путь к видео файлу
}

export const BonusActivationAnimation: React.FC<BonusActivationAnimationProps> = ({
    show,
    text = 'БОНУСНАЯ ИГРА',
    durationMs = 6000,
    videoSrc = '/5.mp4',
        }) => {
    const [isVisible, setIsVisible] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!show) {
            setIsVisible(false);
            return;
        }

        setIsVisible(true);

        // Воспроизведение видео при показе
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(e => console.log('Autoplay prevented:', e));
        }

        const t = window.setTimeout(() => setIsVisible(false), durationMs);
        return () => window.clearTimeout(t);
    }, [show, durationMs]);

    if (!isVisible) return null;

    return (
        <div className="bonus-activation-overlay" aria-hidden="true">
            {/* Видео как фон */}
            <video
                ref={videoRef}
                className="bonus-activation-video"
                autoPlay
                muted
                loop
                playsInline
                src={videoSrc}
            />

            {/* Полупрозрачный затемняющий слой */}
            <div className="bonus-activation-backdrop" />

            {/* Основной контент поверх видео */}
            <div className="bonus-activation-content">
                <div className="bonus-activation-sparkles" />
                <div className="bonus-activation-title">{text}</div>
                <div className="bonus-activation-subtitle">Бесплатные вращения активированы</div>
            </div>
        </div>
    );
};