import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import {NeonLoading} from "@widgets/Loading/NeonLoading.tsx";

const GamesMenuPage = React.lazy(() => import('@pages/GamesMenuPage'));
const GamePage = React.lazy(() => import('@pages/GamePage'));
const CascadeGamePage = React.lazy(() => import('@pages/CascadeGamePage'));


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

    return (
        <div className="app-container">
            <RouterProvider router={router} />
        </div>
    );
};