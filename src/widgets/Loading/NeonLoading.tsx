import './NeonLoading.css';

export const NeonLoading = () => {
    return (
        <div className="neon-loader">
            <div className="neon-text">КАЗИНО</div>
            <div className="neon-subtext">ЗАГРУЗКА...</div>
            <div className="progress-container">
                <div className="progress-bar">
                    <div className="progress-fill"></div>
                </div>
            </div>
        </div>
    );
};