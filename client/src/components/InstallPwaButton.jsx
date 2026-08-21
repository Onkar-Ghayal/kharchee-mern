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
    compact = false,
    asDropdownItem = false,
    onAfterClick = null
}) {
    const [deferredPrompt, setDeferredPrompt] = useState(globalDeferredPrompt);
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
            } catch (err) {
                setShowIosModal(true);
            }
        } else {
            // Show instructions modal if browser hasn't emitted prompt yet
            setShowIosModal(true);
        }
    };

    return (
        <>
            {asDropdownItem ? (
                <button
                    type="button"
                    className="dropdown-item pwa-dropdown-btn"
                    onClick={handleInstallClick}
                >
                    <span className="dropdown-item-icon">📲</span>
                    <span>Install Kharchee App</span>
                </button>
            ) : (
                <button
                    type="button"
                    className={`btn-pwa-install ${compact ? "compact" : ""} ${className}`}
                    onClick={handleInstallClick}
                    title="Install Kharchee as Mobile App"
                    aria-label="Install App"
                >
                    <span className="pwa-install-icon">📲</span>
                    <span className="pwa-install-text">{compact ? "Install" : "Install App"}</span>
                    <span className="pwa-pulse-dot" />
                </button>
            )}

            {/* Install Instructions Modal */}
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
                            Install Kharchee on your home screen for full-screen mode, 1-tap quick access, and offline ledger viewing!
                        </p>

                        <div className="pwa-steps-list">
                            <div className="pwa-step-item">
                                <div className="pwa-step-number">1</div>
                                <div className="pwa-step-info">
                                    <strong>{isIos ? "Tap the Share button" : "Open Browser Options"}</strong>
                                    <span>
                                        {isIos
                                            ? "Tap the Share icon [ ⎋ / ↑ ] at the bottom of Safari."
                                            : "Tap the 3-dot menu icon [ ⋮ ] in the top-right of Chrome / Edge."}
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

/**
 * Prominent Mobile Floating Banner for First-Time Mobile Visitors
 */
export function MobileInstallFloatingBanner() {
    const [visible, setVisible] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const isStand =
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone === true ||
            document.referrer.includes("android-app://");
        setIsStandalone(isStand);

        const dismissed = sessionStorage.getItem("pwa_banner_dismissed");
        if (!isStand && !dismissed) {
            // Show banner after 1.5s
            const t = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(t);
        }
    }, []);

    if (isStandalone || !visible) return null;

    const handleDismiss = () => {
        setVisible(false);
        sessionStorage.setItem("pwa_banner_dismissed", "true");
    };

    const handleInstall = async () => {
        if (globalDeferredPrompt) {
            try {
                globalDeferredPrompt.prompt();
                const { outcome } = await globalDeferredPrompt.userChoice;
                if (outcome === "accepted") {
                    globalDeferredPrompt = null;
                    setVisible(false);
                }
            } catch {
                setShowModal(true);
            }
        } else {
            setShowModal(true);
        }
    };

    return (
        <>
            <div className="mobile-pwa-banner">
                <div className="banner-left">
                    <img src="/assets/images/logo.png" alt="Kharchee" className="banner-logo" />
                    <div className="banner-text">
                        <strong>Install Kharchee App</strong>
                        <span>Faster 1-tap mobile experience</span>
                    </div>
                </div>
                <div className="banner-actions">
                    <button type="button" className="banner-btn-install" onClick={handleInstall}>
                        Install
                    </button>
                    <button type="button" className="banner-btn-close" onClick={handleDismiss} aria-label="Dismiss">
                        ✕
                    </button>
                </div>
            </div>

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
                            Tap your browser's menu <strong>[ ⋮ ]</strong> and select <strong>"Add to Home Screen"</strong> or <strong>"Install app"</strong> to install Kharchee!
                        </p>
                        <button
                            type="button"
                            className="btn-pwa-gotit"
                            onClick={() => {
                                setShowModal(false);
                                handleDismiss();
                            }}
                        >
                            Got It!
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
