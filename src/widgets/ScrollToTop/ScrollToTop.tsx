import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Мгновенный скролл вверх без анимации (самый надёжный на мобильных)
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

        // Альтернатива, если 'instant' не сработает на iOS:
        // document.documentElement.scrollTop = 0;
        // document.body.scrollTop = 0;
    }, [pathname]);

    return null;
};