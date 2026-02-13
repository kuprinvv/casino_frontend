import { useEffect, useState } from 'react';

export const useVideoPreload = (src: string) => {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const video = document.createElement('video');
        video.src = src;
        video.preload = 'auto';
        video.muted = true;
        video.playsInline = true;

        const handleLoaded = () => setLoaded(true);
        video.addEventListener('canplaythrough', handleLoaded);

        // Принудительная загрузка
        video.load();

        return () => {
            video.removeEventListener('canplaythrough', handleLoaded);
            video.src = '';
        };
    }, [src]);

    return loaded;
};