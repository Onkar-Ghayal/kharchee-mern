import { useState, useEffect } from "react";

// Global persistent prompt holder
let globalDeferredPrompt = null;
if (typeof window !== "undefined") {
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        globalDeferredPrompt = e;
        window.dispatchEvent(new Event("pwa-prompt-available"));
    });
}

export default function InstallPwaButton({
    className = "",
    label = "Install App",
    onAfterClick = null
}) {
    const [deferredPrompt, setDeferredPrompt] = useState(globalDeferredPrompt);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isIos, setIsIos] = useState(false);

    useEffect(() => {
        // 1. Check if already running standalone as installed PWA
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

        // 3. Listen for global PWA prompt event
        const handlePromptAvailable = () => {
            setDeferredPrompt(globalDeferredPrompt);
        };
        window.addEventListener("pwa-prompt-available", handlePromptAvailable);

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            globalDeferredPrompt = e;
            setDeferredPrompt(e);
        };
        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("pwa-prompt-available", handlePromptAvailable);
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    // Don't render anything if already installed as standalone app
    if (isStandalone) return null;

    // Handle Install Click
    const handleInstallClick = async () => {
        if (onAfterClick) onAfterClick();

        const activePrompt = deferredPrompt || globalDeferredPrompt;

        if (activePrompt) {
            try {
                activePrompt.prompt();
                const { outcome } = await activePrompt.userChoice;
                if (outcome === "accepted") {
                    globalDeferredPrompt = null;
                    setDeferredPrompt(null);
                }
            } catch {
                setShowModal(true);
            }
        } else {
            // Show guide modal if browser hasn't emitted native prompt
            setShowModal(true);
        }
    };

    return (
        <>
            <button
                type="button"
                className={`btn-pwa-action ${className}`}
                onClick={handleInstallClick}
                title="Install Kharchee as App"
                aria-label="Install App"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pwa-svg-icon"
                >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>{label}</span>
            </button>

            {/* Install Instructions Modal */}
            {showModal && (
                <div className="pwa-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="pwa-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="pwa-modal-header">
                            <div className="pwa-modal-icon-wrap">
                                <img src="/assets/images/logo.png" alt="Kharchee" className="pwa-modal-logo" />
                            </div>
                            <h3>Install Kharchee App</h3>
                            <button
                                type="button"
                                className="pwa-modal-close"
                                onClick={() => setShowModal(false)}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="pwa-modal-desc">
                            Install Kharchee on your home screen for full-screen mode, 1-tap quick access, and offline ledger viewing!
                        </p>

                        <div className="pwa-steps-list">
                            <div className="pwa-step-item">
                                <div className="pwa-step-number">1</div>
                                <div className="pwa-step-info">
                                    <strong>{isIos ? "Tap the Share button" : "Open Browser Menu"}</strong>
                                    <span>
                                        {isIos
                                            ? "Tap the Share icon [ ⎋ / ↑ ] at the bottom of Safari."
                                            : "Tap the 3-dot menu icon [ ⋮ ] in your browser."}
                                    </span>
                                </div>
                            </div>

                            <div className="pwa-step-item">
                                <div className="pwa-step-number">2</div>
                                <div className="pwa-step-info">
                                    <strong>Select 'Add to Home screen'</strong>
                                    <span>
                                        Tap <strong>[ + ] Add to Home Screen</strong> or <strong>Install App</strong>.
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="btn-pwa-gotit"
                            onClick={() => setShowModal(false)}
                        >
                            Got It!
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
