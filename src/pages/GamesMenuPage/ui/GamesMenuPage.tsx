import React from 'react';
import { Link } from 'react-router-dom';
import styles from './GamesMenuPage.module.css';
import { UserPanel } from "@widgets/UserPanel";

export type GameRoute = '/line' | '/cascade';

type GameCard = {
    id: 'line' | 'cascade';
    title: string;
    subtitle: string;
    badge?: string;
    route: GameRoute;
    theme: 'santa' | 'xmas' | 'hell' | 'coins';
};

const GAMES: GameCard[] = [
    {
        id: 'line',
        title: 'SLOT MACHINE',
        subtitle: 'Линии • 5×3',
        badge: 'NEW',
        route: '/line',
        theme: 'hell',
    },
    {
        id: 'cascade',
        title: 'SUGAR RUSH',
        subtitle: 'Каскад • 7×7',
        badge: 'NEW',
        route: '/cascade',
        theme: 'xmas',
    },
];

export const GamesMenuPage: React.FC = () => {
    return (
        <div className={styles["games-menu-page"]}>
            <header className={styles["games-menu-header"]}>
                <div className={styles["brand"]}>
                    <div className={styles["brand-mark"]} >🎮</div>
                    <div className={styles["brand-name"]}>casino</div>
                </div>
                <nav className={styles["top-nav"]}>
                    <Link className={`${styles["top-nav-link"]} ${styles["active"]}`} to="/">HOME</Link>
                    <Link className={styles["top-nav-link"]} to="/">GAMES</Link>
                    <span className={`${styles["top-nav-link"]} ${styles["muted"]}`}>ABOUT</span>
                    <span className={`${styles["top-nav-link"]} ${styles["muted"]}`}>PARTNERS</span>
                    <span className={`${styles["top-nav-link"]} ${styles["muted"]}`}>NEWS</span>
                </nav>
                <UserPanel/>
            </header>

            <main className={styles["games-menu-content"]}>
                <div className={styles["games-grid"]}>
                    {GAMES.map((game) => (
                        <div key={game.id} className={`${styles["game-card"]} ${styles[`theme-${game.theme}`]}`}>
                            {game.badge && <div className={styles["game-badge"]}>{game.badge}</div>}

                            <div className={styles["game-thumb"]} role="img" aria-label={game.title}>
                                <div className={styles["game-thumb-glow"]} />
                                <div className={styles["game-thumb-title"]}>{game.title}</div>
                            </div>

                            <div className={styles["game-title"]}>{game.title}</div>
                            <div className={styles["game-subtitle"]}>{game.subtitle}</div>

                            <Link className={styles["game-cta"]} to={game.route}>
                                ИГРАТЬ
                            </Link>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};