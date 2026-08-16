import { useEffect, useState } from "react";

const BUTTONS = [
    { value: "7" }, { value: "8" }, { value: "9" }, { value: "/", label: "÷" },
    { value: "4" }, { value: "5" }, { value: "6" }, { value: "*", label: "×" },
    { value: "1" }, { value: "2" }, { value: "3" }, { value: "-", label: "−" },
    { action: "clear", label: "C" }, { value: "0" }, { value: "." }, { value: "+" }
];

export default function CalculatorModal({ open, initialValue, onClose, onUse }) {
    const [expression, setExpression] = useState("");

    useEffect(() => {
        if (open) {
            setExpression(initialValue !== undefined ? String(initialValue) : "");
        }
    }, [open, initialValue]);

    if (!open) return null;

    const handleButton = (btn) => {
        if (btn.action === "clear") {
            setExpression("");
        } else {
            setExpression((prev) => prev + btn.value);
        }
    };

    const handleBackspace = () => {
        setExpression((prev) => prev.slice(0, -1));
    };

    // Safe evaluator for simple +,-,*,/ chains built only from the keypad above.
    // No eval() — tokenizes the expression and applies standard operator precedence.
    function safeEvaluate(expr) {
        const tokens = expr.match(/(\d+\.?\d*)|[+\-*/]/g);
        if (!tokens || !tokens.length) return 0;

        // Pass 1: handle * and /
        const stage1 = [];
        let i = 0;
        stage1.push(parseFloat(tokens[i++]) || 0);
        while (i < tokens.length) {
            const op = tokens[i++];
            const num = parseFloat(tokens[i++]) || 0;
            if (op === "*") {
                stage1[stage1.length - 1] *= num;
            } else if (op === "/") {
                stage1[stage1.length - 1] /= num || 1;
            } else {
                stage1.push(op, num);
            }
        }

        // Pass 2: handle + and -
        let result = stage1[0];
        for (let j = 1; j < stage1.length; j += 2) {
            const op = stage1[j];
            const num = stage1[j + 1];
            result = op === "-" ? result - num : result + num;
        }

        return isNaN(result) ? 0 : result;
    }

    const handleUse = () => {
        const result = safeEvaluate(expression || "0");
        onUse(result);
    };

    return (
        <div className="modal calculator-modal" style={{ display: "flex" }}>
            <div className="modal-content calculator-content">
                <h3>Calculator</h3>

                <div className="calculator-display">
                    <input type="text" readOnly value={expression || "0"} />
                </div>

                <div className="calculator-buttons">
                    {BUTTONS.map((btn, i) => (
                        <button
                            key={i}
                            className={btn.action === "cut" ? "cut-btn" : ""}
                            onClick={() => handleButton(btn)}
                        >
                            {btn.label || btn.value}
                        </button>
                    ))}
                    <button className="cut-btn" onClick={handleBackspace}>⌫</button>
                </div>

                <div className="modal-actions">
                    <button className="btn-submit use-calculated-amount" onClick={handleUse}>Use This Amount</button>
                    <button className="btn-cancel close-calculator" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
}
