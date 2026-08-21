import { useState, useEffect } from "react";

export default function InstallPwaButton({ className = "", compact = false }) {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showIosModal, setShowIosModal] = useState(false);
    const [isIos, setIsIos] = useState(false);

    useEffect(() => {
        // 1. Check if already installed & running standalone
        const checkStandalone = () => {
            const isStand =
                window.matchMedia("(display-mode: standalone)").matches ||
                window.navigator.standalone === true ||
                document.referrer.includes("android-app://");
            setIsStandalone(isStand);
        };
        checkStandalone();

        // 2. Check if iOS device
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIos(isIosDevice);

        // 3. Listen for Chromium/Android install prompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    // Don't render anything if already installed as standalone app
    if (isStandalone) return null;

    // Handle Install Click
    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setDeferredPrompt(null);
            }
        } else if (isIos) {
            setShowIosModal(true);
        } else {
            // Fallback for browsers that don't emit prompt or already dismissed
            setShowIosModal(true);
        }
    };

    return (
        <>
            <button
                type="button"
                className={`btn-pwa-install ${compact ? "compact" : ""} ${className}`}
                onClick={handleInstallClick}
                title="Install Kharchee as App"
                aria-label="Install App"
            >
                <span className="pwa-install-icon">📲</span>
                <span className="pwa-install-text">{compact ? "App" : "Install App"}</span>
                <span className="pwa-pulse-dot" />
            </button>

            {/* iOS / Browser Install Instructions Modal */}
            {showIosModal && (
                <div className="pwa-modal-overlay" onClick={() => setShowIosModal(false)}>
                    <div className="pwa-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="pwa-modal-header">
                            <div className="pwa-modal-icon-wrap">
                                <img src="/assets/images/logo.png" alt="Kharchee" className="pwa-modal-logo" />
                            </div>
                            <h3>Install Kharchee App</h3>
                            <button
                                type="button"
                                className="pwa-modal-close"
                                onClick={() => setShowIosModal(false)}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="pwa-modal-desc">
                            Install Kharchee on your home screen for instantaneous loading, full screen mode, and offline access!
                        </p>

                        <div className="pwa-steps-list">
                            <div className="pwa-step-item">
                                <div className="pwa-step-number">1</div>
                                <div className="pwa-step-info">
                                    <strong>Tap the Share button</strong>
                                    <span>
                                        {isIos ? "Tap the Share icon [ ⎋ / ↑ ] at the bottom of Safari." : "Open your browser options menu [ ⋮ ]."}
                                    </span>
                                </div>
                            </div>

                            <div className="pwa-step-item">
                                <div className="pwa-step-number">2</div>
                                <div className="pwa-step-info">
                                    <strong>Select 'Add to Home Screen'</strong>
                                    <span>Tap the <strong>[ + ] Add to Home Screen</strong> or <strong>Install App</strong> option.</span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="btn-pwa-gotit"
                            onClick={() => setShowIosModal(false)}
                        >
                            Got It!
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
