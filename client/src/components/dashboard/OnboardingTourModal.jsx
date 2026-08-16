import { useState } from "react";

const TOUR_STEPS = [
    {
        step: 1,
        badge: "Step 1 of 7",
        icon: "👥",
        title: "Adding Friends",
        headline: "Track shared expenses with 0 initial balance",
        description:
            "Click '+ Add Friend' to add friends by name, their compulsory WhatsApp mobile number, and optional UPI ID (GPay / PhonePe) for 1-tap direct payments.",
        highlights: [
            "✨ Fresh ledger starting at ₹0",
            "📱 WhatsApp number for 1-tap reminders",
            "💳 Attached UPI ID for instant direct payments"
        ]
    },
    {
        step: 2,
        badge: "Step 2 of 7",
        icon: "💰",
        title: "Logging Transactions",
        headline: "Clear You Will Get vs You Owe tracking",
        description:
            "Click '+ Add' on any friend card. Select 🟢 + You Will Get (You Paid / Lent) or 🔴 - You Owe (Friend Paid / Borrowed), type the amount, and add an optional note like 'Dinner' or 'Cab'.",
        highlights: [
            "🟢 + You Will Get (Light Green button)",
            "🔴 - You Owe (Light Red button)",
            "📝 Optional notes (Dinner, Cab, Hotel) for clarity"
        ]
    },
    {
        step: 3,
        badge: "Step 3 of 7",
        icon: "⚡",
        title: "Split Group Bills",
        headline: "Divide hotel, trip & dinner expenses effortlessly",
        description:
            "Tap '⚡ Split a Bill' to divide group expenses. Choose Equal Split or Custom itemized shares per friend, toggle 'Include Myself', and confirm with 1 tap.",
        highlights: [
            "⚖️ 1-Tap Equal Split among friends",
            "✏️ Custom unequal shares per person",
            "🛡️ Review & Confirmation safety popup"
        ]
    },
    {
        step: 4,
        badge: "Step 4 of 7",
        icon: "🧮",
        title: "Built-in Calculator",
        headline: "Add receipts & divide bills on the spot",
        description:
            "Tap the calculator icon on any friend's card to add up receipts or divide hotel & travel bills (e.g. 2400 / 4 + 150). Tap 'Use This Amount' to pre-fill the entry directly.",
        highlights: [
            "🔢 Full arithmetic (+, -, ×, ÷) with live result",
            "⚡ 1-Tap 'Use This Amount' auto pre-fill",
            "💡 Eliminates switching between calculator apps"
        ]
    },
    {
        step: 5,
        badge: "Step 5 of 7",
        icon: "💳",
        title: "1-Tap Settle & Reminders",
        headline: "Direct Google Pay / PhonePe launch & WhatsApp alerts",
        description:
            "If you owe money, tap 'Pay' to launch Google Pay, PhonePe, or Paytm with return verification. If they owe you, tap 'Remind' to send a polite WhatsApp message.",
        highlights: [
            "📲 Direct 1-Tap launch to GPay, PhonePe, Paytm",
            "💬 4 polite WhatsApp reminder styles with live preview",
            "🔒 Fixed recipient locking prevents mistakes"
        ]
    },
    {
        step: 6,
        badge: "Step 6 of 7",
        icon: "📜",
        title: "Ledger History & Statements",
        headline: "1-Click undo and official PDF/CSV statement downloads",
        description:
            "Click the History icon to view the full chronological timeline. Delete mistaken entries with 1-click automatic balance reversal or download branded PDF statements.",
        highlights: [
            "✕ 1-Click delete/undo with balance reversal",
            "📄 Branded PDF statement with summary cards",
            "📊 Export spreadsheet to Excel/CSV"
        ]
    },
    {
        step: 7,
        badge: "Step 7 of 7",
        icon: "📊",
        title: "Analytics & Smart Insights",
        headline: "Track cash flow velocity, bills paid, and top friends",
        description:
            "Visit the Analytics tab to view interactive charts of your cash flow, total bills paid & split, top friend balances, and intelligent financial summaries.",
        highlights: [
            "📈 Responsive Cash Flow & Net Flow charts",
            "💳 Bills Paid & ⚡ Bills Split KPI tracking",
            "🏆 Top friends financial debt leaderboard"
        ]
    }
];

export default function OnboardingTourModal({
    open,
    onClose,
    userName = "Friend"
}) {
    const [currentStep, setCurrentStep] = useState(0);

    if (!open) return null;

    const stepData = TOUR_STEPS[currentStep];
    const isLastStep = currentStep === TOUR_STEPS.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            onClose();
        } else {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    return (
        <div className="modal tour-modal-backdrop" style={{ display: "flex" }}>
            <div className="modal-content tour-modal-content">
                {/* Top Header Bar */}
                <div className="tour-header-bar">
                    <div className="tour-badge-pill">{stepData.badge}</div>
                    <button
                        type="button"
                        className="tour-btn-skip"
                        onClick={onClose}
                    >
                        Skip Tour ✕
                    </button>
                </div>

                {/* Main Feature Illustration Card */}
                <div className="tour-card-body">
                    <div className="tour-icon-bubble">{stepData.icon}</div>
                    <h3 className="tour-step-title">{stepData.title}</h3>
                    <h4 className="tour-step-headline">{stepData.headline}</h4>
                    <p className="tour-step-desc">{stepData.description}</p>

                    {/* Feature Highlight Pills */}
                    <div className="tour-highlights-box">
                        {stepData.highlights.map((h, i) => (
                            <div key={i} className="tour-highlight-item">
                                {h}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Progress Dots Indicator */}
                <div className="tour-dots-indicator">
                    {TOUR_STEPS.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            className={`tour-dot ${currentStep === index ? "active" : ""}`}
                            onClick={() => setCurrentStep(index)}
                            aria-label={`Go to step ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Bottom Navigation Toolbar */}
                <div className="tour-footer-toolbar">
                    <button
                        type="button"
                        className="tour-btn-back"
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                    >
                        ← Back
                    </button>

                    <button
                        type="button"
                        className="tour-btn-next"
                        onClick={handleNext}
                    >
                        {isLastStep ? "Get Started 🚀" : "Next →"}
                    </button>
                </div>
            </div>
        </div>
    );
}
