import React, { useEffect, useState, useRef } from 'react';
import './BonusActivationAnimation.css';

interface BonusActivationAnimationProps {
    show: boolean;
    text?: string;
    durationMs?: number;
    videoSrc?: string;
}

export const BonusActivationAnimation: React.FC<BonusActivationAnimationProps> = ({
   show,
   text = 'БОНУСНАЯ ИГРА',
   durationMs = 6000,
   videoSrc = '/bonusVideo.mp4',
    }) => {
    const [isVisible, setIsVisible] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!show) {
            setIsVisible(false);
            return;
        }

        setIsVisible(true);

        // Запускаем видео при показе
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(e => console.log('Playback error:', e));
        }

        const timer = window.setTimeout(() => setIsVisible(false), durationMs);
        return () => window.clearTimeout(timer);
    }, [show, durationMs]);

    if (!isVisible) return null;

    return (
        <div className="bonus-activation-overlay" aria-hidden="true">
            {/* Видео с предзагрузкой */}
            <video
                ref={videoRef}
                className="bonus-activation-video"
                autoPlay
                muted
                playsInline
                preload="auto"
                src={videoSrc}
            />

            <div className="bonus-activation-backdrop" />
            <div className="bonus-activation-content">
                <div className="bonus-activation-sparkles" />
                <div className="bonus-activation-title">{text}</div>
                <div className="bonus-activation-subtitle">Бесплатные вращения активированы</div>
            </div>
        </div>
    );
};