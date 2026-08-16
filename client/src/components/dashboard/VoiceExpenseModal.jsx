import { useState, useEffect, useRef } from "react";
import { parseVoiceExpense } from "../../utils/voiceParser";

export default function VoiceExpenseModal({
    open,
    friends = [],
    onClose,
    onSubmit
}) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [selectedFriendId, setSelectedFriendId] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState("given"); // 'given' (+ amount) | 'taken' (- amount)
    const [description, setDescription] = useState("");
    const [speechSupported, setSpeechSupported] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const recognitionRef = useRef(null);

    // Initialize Web Speech API
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setSpeechSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-IN"; // English (India) - excels with Indian names, accents, and Hinglish

        recognition.onstart = () => {
            setIsListening(true);
            setError("");
        };

        recognition.onresult = (event) => {
            let currentTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
            }

            if (currentTranscript.trim()) {
                setTranscript(currentTranscript);

                // Smart AI extraction from speech
                const parsed = parseVoiceExpense(currentTranscript, friends);

                if (parsed.friend) {
                    setSelectedFriendId(parsed.friend._id);
                }
                if (parsed.amount > 0) {
                    setAmount(String(parsed.amount));
                }
                if (parsed.type) {
                    setType(parsed.type);
                }
                if (parsed.description) {
                    setDescription(parsed.description);
                }
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            if (event.error === "not-allowed") {
                setError("Microphone permission denied. Please allow microphone access in your browser settings.");
            } else if (event.error !== "no-speech") {
                setError(`Voice error: ${event.error}`);
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch {}
            }
        };
    }, [friends]);

    // Handle modal open lifecycle
    useEffect(() => {
        if (!open) {
            if (recognitionRef.current && isListening) {
                try {
                    recognitionRef.current.stop();
                } catch {}
            }
            setIsListening(false);
            setTranscript("");
            setSelectedFriendId("");
            setAmount("");
            setDescription("");
            setError("");
            return;
        }

        // Reset state on modal open
        setTranscript("");
        setSelectedFriendId("");
        setAmount("");
        setDescription("");
        setError("");

        // Auto-start listening when modal opens
        if (recognitionRef.current && speechSupported) {
            try {
                recognitionRef.current.start();
            } catch {}
        }
    }, [open, speechSupported]);

    if (!open) return null;

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setError("");
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.error("Start speech error:", err);
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError("");

        const num = Number(amount);
        if (!num || isNaN(num) || num <= 0) {
            setError("Please state or enter an amount greater than 0");
            return;
        }

        if (!selectedFriendId) {
            setError("Please select or speak the friend's name");
            return;
        }

        setSaving(true);
        try {
            const finalAmount = type === "taken" ? -num : num;
            await onSubmit({
                friendId: selectedFriendId,
                amount: finalAmount,
                description: description.trim() || "Voice Recorded Expense"
            });
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save expense");
        } finally {
            setSaving(false);
        }
    };

    const selectedFriendObj = friends.find((f) => f._id === selectedFriendId);

    return (
        <div className="modal voice-modal-backdrop" style={{ display: "flex" }}>
            <div className="modal-content voice-modal-content">
                {/* Header */}
                <div className="modal-header-row">
                    <div className="voice-header-title-group">
                        <div className="voice-header-icon">🎙️</div>
                        <div>
                            <h3>Voice Expense Entry</h3>
                            <p className="voice-header-sub">Speak naturally to log expenses</p>
                        </div>
                    </div>
                    <button type="button" className="modal-close-x" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {/* Animated Pulsing Mic Center */}
                <div className="voice-mic-container">
                    <button
                        type="button"
                        className={`btn-voice-mic-main ${isListening ? "listening" : ""}`}
                        onClick={toggleListening}
                        title={isListening ? "Listening... Tap to stop" : "Tap to start speaking"}
                    >
                        <div className="mic-wave-ring ring-1"></div>
                        <div className="mic-wave-ring ring-2"></div>
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                            <line x1="12" y1="19" x2="12" y2="23"></line>
                            <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                    </button>
                    <span className="voice-status-badge">
                        {isListening ? "🎙️ Listening... Speak now" : "Tap mic to speak"}
                    </span>
                </div>

                {/* Live Speech Recognition Transcript */}
                <div className="voice-transcript-box">
                    <span className="transcript-label">What you said:</span>
                    <p className="transcript-text">
                        {transcript ? (
                            `"${transcript}"`
                        ) : (
                            <span className="transcript-placeholder">
                                Say: <em>"Add 500 for Rahul dinner"</em> or <em>"Amit ko 250 diya chai"</em>
                            </span>
                        )}
                    </p>
                </div>

                {/* AI Extracted Result Form */}
                <form onSubmit={handleSave} className="voice-extracted-form">
                    <div className="ai-extracted-banner">
                        <span className="ai-tag">✨ AI Extracted Details</span>
                    </div>

                    <div className="voice-form-grid">
                        {/* Friend Selector */}
                        <div className="form-group">
                            <label>Friend Name</label>
                            <select
                                value={selectedFriendId}
                                onChange={(e) => setSelectedFriendId(e.target.value)}
                                required
                            >
                                <option value="">Select Friend...</option>
                                {friends.map((f) => (
                                    <option key={f._id} value={f._id}>
                                        {f.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Amount */}
                        <div className="form-group">
                            <label>Amount (₹)</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={amount}
                                min="1"
                                required
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Transaction Direction (You Will Get vs You Owe) */}
                    <div className="form-group">
                        <label>Type</label>
                        <div className="voice-type-toggle">
                            <button
                                type="button"
                                className={`type-toggle-btn ${type === "given" ? "active-given" : ""}`}
                                onClick={() => setType("given")}
                            >
                                <span>+ You Will Get (I Paid)</span>
                            </button>
                            <button
                                type="button"
                                className={`type-toggle-btn ${type === "taken" ? "active-taken" : ""}`}
                                onClick={() => setType("taken")}
                            >
                                <span>- You Owe (Friend Paid)</span>
                            </button>
                        </div>
                    </div>

                    {/* Reason / Note */}
                    <div className="form-group">
                        <label>Reason / Note</label>
                        <input
                            type="text"
                            placeholder="e.g. Dinner, Chai, Cab fare, Petrol"
                            value={description}
                            maxLength={100}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {error && <p className="form-error voice-error-banner">{error}</p>}

                    {/* Big Action Save Button */}
                    <div className="voice-modal-footer">
                        <button
                            type="submit"
                            className="btn-voice-submit big-btn"
                            disabled={saving || !Number(amount) || !selectedFriendId}
                        >
                            {saving
                                ? "Saving..."
                                : selectedFriendObj && Number(amount) > 0
                                ? `✓ Save ${type === "taken" ? "-₹" : "+₹"}${Number(amount).toLocaleString("en-IN")} for ${selectedFriendObj.name}`
                                : "✓ Confirm & Save to Ledger"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
