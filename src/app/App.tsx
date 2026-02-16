import React, { Suspense, useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import '@app/App.css';

const GamesMenuPage = React.lazy(() => import('@pages/GamesMenuPage'));
const GamePage = React.lazy(() => import('@pages/GamePage'));
const CascadeGamePage = React.lazy(() => import('@pages/CascadeGamePage'));

const preloadGameAssets = () => {
    const assets = [
        '/1.png', '/2.png', '/3.png', '/4.png', '/5.png', '/6.png', '/7.png',
        '/8.png', '/9.png', '/auto.png', '/bg.png', '/play.png', '/turbo.png',
        '/turbo2.png', '/w.png', '/wild.png', '/board.png', '/bonus.png',
        '/bonus-btn.png', '/bonus-btn2.png', '/5.mp4', '/bonusVideo.mp4'
    ];

    assets.forEach(src => {
        if (src.endsWith('.mp4')) {
            const video = document.createElement('video');
            video.src = src;
            video.preload = 'auto';
        } else {
            const img = new Image();
            img.src = src;
        }
    });
};

const NeonLoading = () => (
    <div className="neon-loader">
        <div className="neon-text">КАЗИНО</div>
        <div className="neon-subtext">ЗАГРУЗКА...</div>
        <div className="neon-pulse"></div>
    </div>
);

const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <Suspense fallback={<NeonLoading/>}>
                <GamesMenuPage />
            </Suspense>
        )
    },
    {
        path: '/line',
        element: (
            <Suspense fallback={<NeonLoading/>}>
                <GamePage />
            </Suspense>
        )
    },
    {
        path: '/cascade',
        element: (
            <Suspense fallback={<NeonLoading/>}>
                <CascadeGamePage />
            </Suspense>
        )
    },
]);

export const App: React.FC = () => {
    useEffect(() => {
        preloadGameAssets();
    }, []);

    return (
        <div className="app-container">
            <RouterProvider router={router} />
        </div>
    );
};