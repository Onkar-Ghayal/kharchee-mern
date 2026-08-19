import { useEffect, useState, useRef } from "react";

const HISTORY_KEY = "kharchee_calc_history";
const STATE_KEY = "kharchee_calc_expression";

export default function FloatingCalculatorWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [expression, setExpression] = useState(() => {
        return localStorage.getItem(STATE_KEY) || "";
    });
    const [resultPreview, setResultPreview] = useState("");
    const [history, setHistory] = useState(() => {
        try {
            const saved = localStorage.getItem(HISTORY_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [showHistory, setShowHistory] = useState(false);
    const [copied, setCopied] = useState(false);

    const widgetRef = useRef(null);

    // Save expression state to localStorage
    useEffect(() => {
        localStorage.setItem(STATE_KEY, expression);
        if (expression) {
            const evaluated = safeEvaluate(expression);
            setResultPreview(evaluated !== null ? String(evaluated) : "");
        } else {
            setResultPreview("");
        }
    }, [expression]);

    // Save calculation history to localStorage
    useEffect(() => {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }, [history]);

    // Safe mathematical expression evaluator
    function safeEvaluate(expr) {
        if (!expr || typeof expr !== "string") return null;
        try {
            // Replace visual operators with valid JS operators
            let cleanExpr = expr
                .replace(/×/g, "*")
                .replace(/÷/g, "/")
                .replace(/−/g, "-")
                .replace(/%/g, "*0.01");

            // Validate that only safe math characters exist
            if (!/^[0-9+\-*/().\s]+$/.test(cleanExpr)) return null;

            // Simple safe evaluation
            // eslint-disable-next-line no-new-func
            const res = Function(`"use strict"; return (${cleanExpr})`)();
            if (typeof res === "number" && !isNaN(res) && isFinite(res)) {
                // Round to max 6 decimal places for cleanliness
                return Math.round(res * 1000000) / 1000000;
            }
            return null;
        } catch {
            return null;
        }
    }

    const handleButtonClick = (val) => {
        if (val === "AC") {
            setExpression("");
            setResultPreview("");
        } else if (val === "BACKSPACE") {
            setExpression((prev) => prev.slice(0, -1));
        } else if (val === "=") {
            const evaluated = safeEvaluate(expression);
            if (evaluated !== null && expression) {
                const newEntry = {
                    id: Date.now(),
                    expression: expression,
                    result: evaluated,
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                };
                setHistory((prev) => [newEntry, ...prev.slice(0, 19)]); // Keep last 20 calculations
                setExpression(String(evaluated));
            }
        } else {
            setExpression((prev) => prev + val);
        }
    };

    const handleCopyResult = async () => {
        const textToCopy = resultPreview || expression || "0";
        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
        }
    };

    const handleSelectHistoryItem = (item) => {
        setExpression(String(item.result));
        setShowHistory(false);
    };

    const handleClearHistory = () => {
        setHistory([]);
        localStorage.removeItem(HISTORY_KEY);
    };

    // Keyboard support when calculator is open
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            // Don't intercept if focus is inside an input/textarea outside the calculator
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

            if (e.key >= "0" && e.key <= "9") {
                handleButtonClick(e.key);
            } else if (["+", "-", "*", "/", ".", "(", ")"].includes(e.key)) {
                handleButtonClick(e.key);
            } else if (e.key === "Enter" || e.key === "=") {
                e.preventDefault();
                handleButtonClick("=");
            } else if (e.key === "Backspace") {
                handleButtonClick("BACKSPACE");
            } else if (e.key === "Escape") {
                setIsOpen(false);
            } else if (e.key.toLowerCase() === "c") {
                handleButtonClick("AC");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, expression]);

    return (
        <div className="floating-calculator-root" ref={widgetRef}>
            {/* 1. Circular Animated Floating Trigger Button */}
            <div className="fab-calc-wrapper">
                <button
                    type="button"
                    className={`fab-calc-circular-btn ${isOpen ? "active" : ""}`}
                    onClick={() => setIsOpen((prev) => !prev)}
                    title={isOpen ? "Minimize Calculator" : "Open Quick Calculator"}
                    aria-label="Calculator"
                >
                    {/* Animated Pulsing Halo Ring */}
                    <div className="fab-calc-halo-ring" />
                    <div className="fab-calc-halo-glow" />

                    {/* Calculator Icon with Animation */}
                    <div className="fab-calc-icon-inner">
                        {isOpen ? (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                                <line x1="8" y1="6" x2="16" y2="6"></line>
                                <line x1="16" y1="14" x2="16" y2="18"></line>
                                <path d="M16 10h.01"></path>
                                <path d="M12 10h.01"></path>
                                <path d="M8 10h.01"></path>
                                <path d="M12 14h.01"></path>
                                <path d="M8 14h.01"></path>
                                <path d="M12 18h.01"></path>
                                <path d="M8 18h.01"></path>
                            </svg>
                        )}
                    </div>

                    {/* Quick Tooltip Pill */}
                    {!isOpen && <span className="fab-calc-tooltip">Calculator</span>}
                </button>
            </div>

            {/* 2. Pinned Pop-up / Slide-out Calculator Window */}
            {isOpen && (
                <div className="floating-calculator-popup">
                    {/* Header */}
                    <div className="calc-popup-header">
                        <div className="calc-header-title-group">
                            <span className="calc-header-badge">🧮</span>
                            <h4>Smart Calculator</h4>
                        </div>

                        <div className="calc-header-controls">
                            <button
                                type="button"
                                className={`calc-ctrl-btn ${showHistory ? "active" : ""}`}
                                onClick={() => setShowHistory((prev) => !prev)}
                                title="Calculation History"
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <span>History</span>
                            </button>

                            <button
                                type="button"
                                className="calc-ctrl-close"
                                onClick={() => setIsOpen(false)}
                                title="Minimize"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* History Tape Drawer */}
                    {showHistory ? (
                        <div className="calc-history-drawer">
                            <div className="calc-history-drawer-header">
                                <span>Past Calculations ({history.length})</span>
                                {history.length > 0 && (
                                    <button
                                        type="button"
                                        className="btn-clear-calc-history"
                                        onClick={handleClearHistory}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            <div className="calc-history-list">
                                {history.length === 0 ? (
                                    <div className="calc-history-empty">
                                        <span>No previous calculations yet.</span>
                                    </div>
                                ) : (
                                    history.map((item) => (
                                        <div
                                            key={item.id}
                                            className="calc-history-item"
                                            onClick={() => handleSelectHistoryItem(item)}
                                            title="Click to use this result"
                                        >
                                            <span className="history-expr">{item.expression}</span>
                                            <span className="history-result">= {item.result}</span>
                                            <span className="history-time">{item.time}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Screen / Display Area */}
                            <div className="calc-screen-display">
                                <div className="calc-expression-line">
                                    {expression || "0"}
                                </div>
                                <div className="calc-result-line">
                                    <span className="calc-result-value">
                                        {resultPreview && resultPreview !== expression ? `= ${resultPreview}` : ""}
                                    </span>
                                    <button
                                        type="button"
                                        className={`btn-copy-calc-val ${copied ? "copied" : ""}`}
                                        onClick={handleCopyResult}
                                        title="Copy value to clipboard"
                                    >
                                        {copied ? "✓ Copied" : "📋 Copy"}
                                    </button>
                                </div>
                            </div>

                            {/* Calculator Keypad */}
                            <div className="calc-keypad-grid">
                                <button type="button" className="calc-key op-key danger" onClick={() => handleButtonClick("AC")}>AC</button>
                                <button type="button" className="calc-key op-key" onClick={() => handleButtonClick("(")}>(</button>
                                <button type="button" className="calc-key op-key" onClick={() => handleButtonClick(")")}>)</button>
                                <button type="button" className="calc-key op-key action" onClick={() => handleButtonClick("/")}>÷</button>

                                <button type="button" className="calc-key num-key" onClick={() => handleButtonClick("7")}>7</button>
                                <button type="button" className="calc-key num-key" onClick={() => handleButtonClick("8")}>8</button>
                                <button type="button" className="calc-key num-key" onClick={() => handleButtonClick("9")}>9</button>
                                <button type="button" className="calc-key op-key action" onClick={() => handleButtonClick("*")}>×</button>

                                <button type="button" className="calc-key num-key" onClick={() => handleButtonClick("4")}>4</button>
                                <button type="button" className="calc-key num-key" onClick={() => handleButtonClick("5")}>5</button>
                                <button type="button" className="calc-key num-key" onClick={() => handleButtonClick("6")}>6</button>
                                <button type="button" className="calc-key op-key action" onClick={() => handleButtonClick("-")}>−</button>

                                <button type="button" className="calc-key num-key" onClick={() => handleButtonClick("1")}>1</button>
                                <button type="button" className="calc-key num-key" onClick={() => handleButtonClick("2")}>2</button>
                                <button type="button" className="calc-key num-key" onClick={() => handleButtonClick("3")}>3</button>
                                <button type="button" className="calc-key op-key action" onClick={() => handleButtonClick("+")}>+</button>

                                <button type="button" className="calc-key num-key" onClick={() => handleButtonClick("0")}>0</button>
                                <button type="button" className="calc-key num-key" onClick={() => handleButtonClick(".")}>.</button>
                                <button type="button" className="calc-key num-key" onClick={() => handleButtonClick("BACKSPACE")}>⌫</button>
                                <button type="button" className="calc-key equal-key" onClick={() => handleButtonClick("=")}>=</button>
                            </div>
                        </>
                    )}

                    {/* Footer Tip */}
                    <div className="calc-popup-footer">
                        <span>💡 Stays open while you update friend cards</span>
                    </div>
                </div>
            )}
        </div>
    );
}
