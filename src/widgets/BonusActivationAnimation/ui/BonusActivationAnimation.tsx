import React, { useEffect, useState, useRef } from 'react';
import { useVideoPreload } from '@/hooks/useVideoPreload.ts'; // Импортируем хук
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
                                                                                      videoSrc = '/5.mp4',
                                                                                  }) => {
    // Используем хук для предзагрузки
    const videoLoaded = useVideoPreload(videoSrc);

    const [isVisible, setIsVisible] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!show) {
            setIsVisible(false);
            return;
        }

        setIsVisible(true);

        // Воспроизводим ТОЛЬКО если видео загружено
        if (videoRef.current && videoLoaded) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(e => console.log('Autoplay prevented:', e));
        }

        const timer = window.setTimeout(() => setIsVisible(false), durationMs);
        return () => window.clearTimeout(timer);
    }, [show, durationMs, videoLoaded]);

    if (!isVisible) return null;

    return (
        <div className="bonus-activation-overlay" aria-hidden="true">
            <video
                ref={videoRef}
                className="bonus-activation-video"
                muted
                playsInline
                src={videoSrc}
                // Важно: НЕ используем autoPlay здесь!
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